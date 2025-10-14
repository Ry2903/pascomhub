<?php
session_start();
require 'conexao.php';

if (!isset($_SESSION['userid'])) {
    header('Location: login.php');
    exit;
}

$userid = $_SESSION['userid'];

// Busca dados do usuário
$stmt = $pdo->prepare("SELECT * FROM usuarios WHERE userid = ?");
$stmt->execute([$userid]);
$usuario = $stmt->fetch();

// Busca habilidades do usuário
$stmt2 = $pdo->prepare("SELECT habilidade, subhabil FROM userhabil WHERE userid = ?");
$stmt2->execute([$userid]);
$habilidades = $stmt2->fetchAll();
?>

<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Perfil - PascomHub</title>
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
    <h2>Perfil de <?php echo $usuario['nome']; ?></h2>
    <p>Email: <?php echo $usuario['email']; ?></p>
    <p>Tipo: <?php echo $usuario['tipo']; ?></p>

    <h3>Habilidades</h3>
    <ul>
        <?php
        foreach($habilidades as $h) {
            echo "<li>{$h['habilidade']} - {$h['subhabil']}</li>";
        }
        ?>
    </ul>

    <p><a href="index.php">Voltar ao Dashboard</a></p>
</body>
</html>