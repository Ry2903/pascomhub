<?php
session_start();
require 'conexao.php';

if (!isset($_SESSION['userid'])) {
    header('Location: login.php');
    exit;
}

$userid = $_SESSION['userid'];
$msg = '';

if (isset($_GET['reserva']) && isset($_GET['funcaoid'])) {
    $funcaoid = intval($_GET['funcaoid']);
    $stmt = $pdo->prepare("SELECT status FROM funcoesevento WHERE funcaoid = ?");
    $stmt->execute([$funcaoid]);
    $funcao = $stmt->fetch();

    if ($funcao && $funcao['status'] === 'Livre') {
        $stmt = $pdo->prepare("UPDATE funcoesevento SET idresponsavel = ?, status = 'Ocupado' WHERE funcaoid = ?");
        $stmt->execute([$userid, $funcaoid]);
        $msg = "Função reservada com sucesso!";
    } else {
        $msg = "Função já ocupada!";
    }
}

$eventos = $pdo->query("SELECT * FROM eventos ORDER BY data ASC, horario ASC")->fetchAll();
?>

<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Eventos - PascomHub</title>
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
<div style="max-width:900px;margin:30px auto;padding:20px;background-color:#fff;border-radius:15px;box-shadow:0 0 20px rgba(0,0,0,0.2);">

    <h2 style="text-align:center;color:#FFD700;">Escalas / Eventos</h2>
    <?php if($msg) echo "<p style='color:green;text-align:center;'>$msg</p>"; ?>

    <nav style="text-align:center;margin-bottom:25px;">
        <a href="index.php" class="btn-nav">Dashboard</a>
        <a href="perfil.php" class="btn-nav">Perfil</a>
        <a href="logout.php" class="btn-nav">Sair</a>
    </nav>

    <?php foreach($eventos as $evento): ?>
        <hr style="border-color:#003366;">
        <h3 style="color:#003366;"><?= htmlspecialchars($evento['descricao'] ?? 'Sem descrição'); ?></h3>
        <p>Data: <?= date('d/m/Y', strtotime($evento['data'])); ?> | Horário: <?= $evento['horario']; ?></p>

        <?php
        $stmt = $pdo->prepare("
            SELECT f.funcaoid, h.nome AS habilidade, s.nome AS subhabilidade, u.nome AS responsavel, f.status
            FROM funcoesevento f
            INNER JOIN habilidades h ON f.habilidadeid = h.habilidadeid
            LEFT JOIN subhabilidade s ON f.subid = s.subid
            LEFT JOIN usuarios u ON f.idresponsavel = u.userid
            WHERE f.eventoid = ?
        ");
        $stmt->execute([$evento['eventoid']]);
        $funcoes = $stmt->fetchAll();
        ?>

        <table border="1" cellpadding="8" cellspacing="0" style="width:100%;border-collapse:collapse;">
            <thead style="background-color:#003366;color:#FFD700;">
                <tr>
                    <th>Habilidade</th>
                    <th>Sub-Habilidade</th>
                    <th>Responsável</th>
                    <th>Status</th>
                    <th>Ação</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach($funcoes as $f): ?>
                    <tr>
                        <td><?= htmlspecialchars($f['habilidade']); ?></td>
                        <td><?= htmlspecialchars($f['subhabilidade'] ?? '-'); ?></td>
                        <td><?= htmlspecialchars($f['responsavel'] ?? '-'); ?></td>
                        <td><?= htmlspecialchars($f['status']); ?></td>
                        <td>
                            <?php if($f['status'] === 'Livre'): ?>
                                <a href="?reserva=<?= $f['funcaoid']; ?>" class="btn-reserva">Reservar</a>
                            <?php else: ?>
                                -
                            <?php endif; ?>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    <?php endforeach; ?>
</div>
</body>
</html>