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
</head>
<body>
<h2>Escalas / Eventos</h2>
<?php if($msg) echo "<p style='color:green'>$msg</p>"; ?>

<nav>
    <a href="index.php">Dashboard</a> |
    <a href="perfil.php">Perfil</a> |
    <a href="logout.php">Sair</a>
</nav>

<?php foreach($eventos as $evento): ?>
    <hr>
    <h3><?php echo $evento['descricao'] ?? 'Sem descrição'; ?></h3>
    <p>Data: <?php echo date('d/m/Y', strtotime($evento['data'])); ?> | Horário: <?php echo $evento['horario']; ?></p>

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

    <table border="1" cellpadding="5" cellspacing="0">
        <thead>
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
                    <td><?php echo $f['habilidade']; ?></td>
                    <td><?php echo $f['subhabilidade'] ?? '-'; ?></td>
                    <td><?php echo $f['responsavel'] ?? '-'; ?></td>
                    <td><?php echo $f['status']; ?></td>
                    <td>
                        <?php if($f['status'] === 'Livre'): ?>
                            <a href="?reserva=<?php echo $f['funcaoid']; ?>">Reservar</a>
                        <?php else: ?>
                            -
                        <?php endif; ?>
                    </td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
<?php endforeach; ?>
</body>
</html>