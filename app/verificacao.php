<?php
session_start();
require 'conexao.php';

$erro = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'];
    $senha = $_POST['senha'];

    $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    $usuario = $stmt->fetch();

    if ($usuario && $senha === $usuario['senha']) { // futuramente usar password_verify
        $_SESSION['userid'] = $usuario['userid'];
        $_SESSION['nome'] = $usuario['nome'];
        $_SESSION['tipo'] = $usuario['tipo'];
        header('Location: index.php');
        exit;
    } else {
        $erro = "Email ou senha inválidos!";
    }
}
?>