<?php
session_start();
require 'conexao.php';

if (!isset($_SESSION['userid']) || $_SESSION['tipo'] !== 'Coordenador') {
    header('Location: index.php');
    exit;
}

$msg = '';

// Função para verificar duplicidade
function eventoDuplicado($pdo, $data, $horario) {
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM eventos WHERE data = ? AND horario = ?");
    $stmt->execute([$data, $horario]);
    return $stmt->fetchColumn() > 0;
}

// ------------------ Evento Extraordinário ------------------
if (isset($_POST['evento_extraordinario'])) {
    $descricao = $_POST['descricao'] ?? '';
    $data = $_POST['data'] ?? date('Y-m-d');
    $horario = $_POST['horario'] ?? '07h30';
    $funcoes = $_POST['funcoes'] ?? [];

    if (!$descricao) {
        $msg = "Preencha a descrição do evento.";
    } elseif (eventoDuplicado($pdo, $data, $horario)) {
        $msg = "Já existe um evento nesse dia e horário.";
    } else {
        // Cria evento
        $stmt = $pdo->prepare("INSERT INTO eventos (descricao, data, horario) VALUES (?, ?, ?)");
        $stmt->execute([$descricao, $data, $horario]);
        $eventoid = $pdo->lastInsertId();

        // Insere funções selecionadas
        foreach ($funcoes as $f) {
            $f = explode('-', $f); // formato: habilidadeid-subid
            $habilidadeid = (int)$f[0];
            $subid = ($f[1] === 'null') ? null : (int)$f[1];

            $stmt2 = $pdo->prepare("INSERT INTO funcoesevento (eventoid, habilidadeid, subid, status) VALUES (?, ?, ?, 'Livre')");
            if ($subid === null) {
                $stmt2->bindValue(1, $eventoid);
                $stmt2->bindValue(2, $habilidadeid);
                $stmt2->bindValue(3, null, PDO::PARAM_NULL);
                $stmt2->execute();
            } else {
                $stmt2->execute([$eventoid, $habilidadeid, $subid]);
            }
        }

        $msg = "Evento extraordinário criado com sucesso!";
    }
}

// ------------------ Atividade Dominical ------------------
if (isset($_POST['atividade_dominical'])) {
    $data = $_POST['data_padrao'] ?? date('Y-m-d');
    $subPost = 7; // subid de Post Fotos e Homilia

    // Horários padronizados
    $funcoes_por_horario = [
        '07h30' => [
            ['habilidadeid'=>2,'subid'=>null], // Slides
            ['habilidadeid'=>3,'subid'=>1],    // Fotos Profissionais
            ['habilidadeid'=>3,'subid'=>2],    // Fotos com Celular
        ],
        '09h30' => [
            ['habilidadeid'=>2,'subid'=>null], // Slides
            ['habilidadeid'=>4,'subid'=>3],    // Transmissão - Câmera Móvel
            ['habilidadeid'=>4,'subid'=>4],    // Transmissão - Câmera Central
            ['habilidadeid'=>4,'subid'=>5],    // Transmissão - OBS
            ['habilidadeid'=>4,'subid'=>6],    // Transmissão - Feedbacks
            ['habilidadeid'=>3,'subid'=>1],    // Fotos Profissionais
            ['habilidadeid'=>3,'subid'=>2],    // Fotos com Celular
            ['habilidadeid'=>1,'subid'=>$subPost], // Mídias Sociais
        ],
        '19h' => [
            ['habilidadeid'=>2,'subid'=>null], // Slides
            ['habilidadeid'=>3,'subid'=>1],    // Fotos Profissionais
            ['habilidadeid'=>3,'subid'=>2],    // Fotos com Celular
        ]
    ];

    $duplicado = false;
    foreach (array_keys($funcoes_por_horario) as $horario) {
        if (eventoDuplicado($pdo, $data, $horario)) $duplicado = true;
    }

    if ($duplicado) {
        $msg = "Já existe um evento Atividade Dominical nesse dia.";
    } else {
        foreach ($funcoes_por_horario as $horario => $funcoes) {
            $descricao = "Atividade Dominical";
            $stmt = $pdo->prepare("INSERT INTO eventos (descricao, data, horario) VALUES (?, ?, ?)");
            $stmt->execute([$descricao, $data, $horario]);
            $eventoid = $pdo->lastInsertId();

            foreach ($funcoes as $f) {
                $stmt2 = $pdo->prepare("INSERT INTO funcoesevento (eventoid, habilidadeid, subid, status) VALUES (?, ?, ?, 'Livre')");
                if ($f['subid'] === null) {
                    $stmt2->bindValue(1, $eventoid);
                    $stmt2->bindValue(2, $f['habilidadeid']);
                    $stmt2->bindValue(3, null, PDO::PARAM_NULL);
                    $stmt2->execute();
                } else {
                    $stmt2->execute([$eventoid, $f['habilidadeid'], $f['subid']]);
                }
            }
        }
        $msg = "Evento 'Atividade Dominical' criado com todas as funções!";
    }
}
?>

<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Criar Evento - PascomHub</title>
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
<div style="max-width:800px;margin:30px auto;padding:25px;background-color:#fff;border-radius:15px;box-shadow:0 0 20px rgba(0,0,0,0.2);">

    <h2 style="text-align:center;color:#FFD700;">Criar Evento - Coordenador</h2>
    <?php if($msg) echo "<p style='color:green;text-align:center;'>$msg</p>"; ?>

    <!-- Formulário Evento Extraordinário -->
    <h3 style="color:#003366;">Evento Extraordinário</h3>
    <form method="POST">
        <label>Descrição do evento:</label><br>
        <input type="text" name="descricao" required><br><br>

        <label>Data:</label><br>
        <input type="date" name="data" required><br><br>

        <label>Horário:</label><br>
        <select name="horario">
            <option value="07h30">07h30</option>
            <option value="09h30">09h30</option>
            <option value="19h">19h</option>
            <option value="outros">Outros</option>
        </select><br><br>

        <label>Funções disponíveis:</label><br>
        <?php
        // Busca habilidades e sub-habilidades
        $stmt = $pdo->query("SELECT h.habilidadeid, h.nome as hab_nome, s.subid, s.nome as sub_nome 
                             FROM habilidades h 
                             LEFT JOIN subhabilidade s ON h.habilidadeid = s.habilidadeid
                             ORDER BY h.habilidadeid, s.subid");
        $currentHab = '';
        while($row = $stmt->fetch()) {
            if ($currentHab !== $row['hab_nome']) {
                echo "<strong>{$row['hab_nome']}</strong><br>";
                $currentHab = $row['hab_nome'];
            }
            $subid = $row['subid'] ?? 'null';
            $label = $row['sub_nome'] ?? '';
            echo "<input type='checkbox' name='funcoes[]' value='{$row['habilidadeid']}-$subid'> $label<br>";
        }
        ?>
        <br>
        <button type="submit" name="evento_extraordinario">Criar Evento Extraordinário</button>
    </form>

    <!-- Botão Atividade Dominical -->
    <h3 style="color:#003366;">Evento Padrão: Atividade Dominical</h3>
    <form method="POST">
        <label>Data do evento:</label><br>
        <input type="date" name="data_padrao" required><br><br>
        <button type="submit" name="atividade_dominical">Criar Atividade Dominical</button>
    </form>

    <br>
    <a href="index.php" class="btn-nav">Voltar ao Dashboard</a>
</div>
</body>
</html>