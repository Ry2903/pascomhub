<?php
require 'conexao.php';

$mensagem = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nome = $_POST['nome'];
    $email = $_POST['email'];
    $senha = $_POST['senha'];
    $tipo = 'Membro';

    // Verifica se o email já existe
    $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        $mensagem = "Email já cadastrado!";
    } else {
        $stmt = $pdo->prepare("INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)");
        $stmt->execute([$nome, $email, $senha, $tipo]);
        $mensagem = "Cadastro realizado com sucesso!";
    }
}
?>

<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Cadastro - PascomHub</title>
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
    <h2>Cadastro de Usuário</h2>
    <form method="POST">
        <input type="text" name="nome" placeholder="Nome" required><br>
        <input type="email" name="email" placeholder="Email" required><br>
        <input type="password" name="senha" placeholder="Senha" required><br>
        <button type="submit">Cadastrar</button>
    </form>
    <?php if($mensagem) echo "<p>$mensagem</p>"; ?>
    <p>Já possui conta? <a href="index.php">Entrar</a></p>
</body>
</html>