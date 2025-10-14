<?php
session_start();
require 'conexao.php';

// Se usuário já está logado, mostra dashboard
if (isset($_SESSION['userid'])) {
    $nome = $_SESSION['nome'];
    $tipo = $_SESSION['tipo'];
} else {
    // Se não, mostra formulário de login
    header('Location: login.php');
    exit;
}
?>

<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Dashboard - PascomHub</title>
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
    <h2>Bem-vindo, <?php echo $nome; ?>!</h2>
    <p>Tipo de usuário: <?php echo $tipo; ?></p>

    <nav>
        <a href="perfil.php">Perfil</a> |
        <a href="eventos.php">Eventos</a> |
        <a href="logout.php">Sair</a>
    </nav>
</body>
</html>