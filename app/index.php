<?php
session_start();
require 'conexao.php';

if (!isset($_SESSION['userid'])) {
    header('Location: cadastro.php');
    exit;
}

$userid = $_SESSION['userid'];
$nome = $_SESSION['nome'];
$tipo = $_SESSION['tipo'];

// Reservar função
if (isset($_POST['reservar'])) {
    $funcaoid = $_POST['funcaoid'];
    $stmt = $pdo->prepare("UPDATE funcoesevento SET idresponsavel = ?, status = 'Ocupado' WHERE funcaoid = ?");
    $stmt->execute([$userid, $funcaoid]);
}

// Remover funções expiradas automaticamente
$stmt = $pdo->prepare("DELETE FROM eventos WHERE data < CURDATE()");
$stmt->execute();

// Buscar eventos futuros
$stmt = $pdo->prepare("
    SELECT e.eventoid, e.descricao, e.data, e.horario, f.funcaoid, f.habilidadeid, f.subid, f.status, u.nome AS responsavel,
           h.nome AS habilidade_nome, s.nome AS sub_nome
    FROM eventos e
    LEFT JOIN funcoesevento f ON e.eventoid = f.eventoid
    LEFT JOIN usuarios u ON f.idresponsavel = u.userid
    LEFT JOIN habilidades h ON f.habilidadeid = h.habilidadeid
    LEFT JOIN subhabilidade s ON f.subid = s.subid
    WHERE e.data >= CURDATE()
    ORDER BY e.data, e.horario, h.habilidadeid, s.subid
");
$stmt->execute();
$eventos = $stmt->fetchAll();
?>

<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Dashboard - PascomHub</title>
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
<h2>Bem-vindo, <?= htmlspecialchars($nome) ?>!</h2>
<p>Tipo de usuário: <?= htmlspecialchars($tipo) ?></p>

<nav>
    <a href="perfil.php">Perfil</a> |
    <a href="eventos.php">Eventos</a> |
    <?php if($tipo === 'Coordenador'): ?>
        <a href="criar_evento.php">Criar Evento</a> |
    <?php endif; ?>
    <a href="logout.php">Sair</a>
</nav>

<h3>Próximos Eventos</h3>
<?php
$current_eventoid = 0;
foreach ($eventos as $f):
    if ($current_eventoid !== $f['eventoid']):
        if ($current_eventoid !== 0) echo "</table><br>";
        $current_eventoid = $f['eventoid'];
?>
<h4><?= htmlspecialchars($f['descricao']) ?> - <?= date('d/m/Y', strtotime($f['data'])) ?> - <?= $f['horario'] ?></h4>
<table border="1" cellpadding="5">
    <tr>
        <th>Habilidade</th>
        <th>Subfunção</th>
        <th>Status</th>
        <th>Responsável</th>
        <th>Ação</th>
    </tr>
<?php endif; ?>
<tr>
    <td><?= htmlspecialchars($f['habilidade_nome']) ?></td>
    <td><?= htmlspecialchars($f['sub_nome'] ?? '-') ?></td>
    <td><?= htmlspecialchars($f['status']) ?></td>
    <td><?= htmlspecialchars($f['responsavel'] ?? '-') ?></td>
    <td>
        <?php if($f['status'] === 'Livre'): ?>
            <form method="POST" style="margin:0;">
                <input type="hidden" name="funcaoid" value="<?= $f['funcaoid'] ?>">
                <button type="submit" name="reservar">Reservar</button>
            </form>
        <?php else: ?>
            -
        <?php endif; ?>
    </td>
</tr>
<?php endforeach; ?>
<?php if($current_eventoid !== 0) echo "</table>"; ?>
</body>
</html>