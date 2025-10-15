<?php
session_start();
require 'conexao.php';

$erro = '';
$sucesso = '';

$habilidades = $pdo->query("SELECT * FROM habilidades")->fetchAll();
$subhabilidades = $pdo->query("SELECT * FROM subhabilidade")->fetchAll();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nome = $_POST['nome'];
    $email = $_POST['email'];
    $senha = $_POST['senha'];
    $tipo = 'Membro'; 

    $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        $erro = "Email já cadastrado!";
    } else {
        $stmt = $pdo->prepare("INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)");
        $stmt->execute([$nome, $email, $senha, $tipo]);
        $userid = $pdo->lastInsertId();

        if (!empty($_POST['habilidades'])) {
            foreach($_POST['habilidades'] as $habilidadeid) {
                if(!empty($_POST['subhabilidades'][$habilidadeid])) {
                    foreach($_POST['subhabilidades'][$habilidadeid] as $subid) {
                        $stmt2 = $pdo->prepare("INSERT INTO userhabil (userid, habilidade, subhabil) VALUES (?, ?, ?)");
                        $habNome = $pdo->query("SELECT nome FROM habilidades WHERE habilidadeid = $habilidadeid")->fetchColumn();
                        $subNome = $pdo->query("SELECT nome FROM subhabilidade WHERE subid = $subid")->fetchColumn();
                        $stmt2->execute([$userid, $habNome, $subNome]);
                    }
                }
            }
        }
        $sucesso = "Cadastro realizado! Você já pode <a href='login.php'>entrar</a>.";
    }
}
?>

<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Cadastro - PascomHub</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link>
</head>
<body>
<div class="container">
    <h2 class="titulo-dourado">Cadastro</h2>
    <?php if($erro) echo "<p class='erro'>$erro</p>"; ?>
    <?php if($sucesso) echo "<p class='msg'>$sucesso</p>"; ?>

    <form method="POST">
        <input type="text" name="nome" placeholder="Nome" required>
        <input type="email" name="email" placeholder="Email" required>
        <input type="password" name="senha" placeholder="Senha" required>

        <h3 class="subtitulo-dourado">Habilidades</h3>
        <?php foreach($habilidades as $h): ?>
            <label>
                <input type="checkbox" name="habilidades[]" value="<?= $h['habilidadeid'] ?>"> <?= $h['nome'] ?>
            </label>
            <div style="margin-left:20px;">
            <?php foreach($subhabilidades as $s): ?>
                <?php if($s['habilidadeid'] == $h['habilidadeid']): ?>
                    <label>
                        <input type="checkbox" name="subhabilidades[<?= $h['habilidadeid'] ?>][]" value="<?= $s['subid'] ?>"> <?= $s['nome'] ?>
                    </label><br>
                <?php endif; ?>
            <?php endforeach; ?>
            </div>
        <?php endforeach; ?>

        <button type="submit">Cadastrar</button>
    </form>
    <p>Já possui conta? <a class="btn-dourado" href="login.php">Entrar</a></p>
</div>
</body>
</html>