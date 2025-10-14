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

    // Verifica se email já existe
    $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        $erro = "Email já cadastrado!";
    } else {
        // Inserir usuário
        $stmt = $pdo->prepare("INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)");
        $stmt->execute([$nome, $email, $senha, $tipo]);
        $userid = $pdo->lastInsertId();

        // Inserir habilidades + sub-habilidades
        if (!empty($_POST['habilidades'])) {
            foreach($_POST['habilidades'] as $habilidadeid) {
                if(!empty($_POST['subhabilidades'][$habilidadeid])) {
                    foreach($_POST['subhabilidades'][$habilidadeid] as $subid) {
                        $stmt2 = $pdo->prepare("INSERT INTO userhabil (userid, habilidade, subhabil) VALUES (?, (SELECT nome FROM habilidades WHERE habilidadeid=?), (SELECT nome FROM subhabilidade WHERE subid=?))");
                        $stmt2->execute([$userid, $habilidadeid, $subid]);
                    }
                } else {
                    $stmt2 = $pdo->prepare("INSERT INTO userhabil (userid, habilidade) VALUES (?, (SELECT nome FROM habilidades WHERE habilidadeid=?))");
                    $stmt2->execute([$userid, $habilidadeid]);
                }
            }
        }

        $sucesso = "Cadastro realizado com sucesso! <a href='login.php'>Faça login</a>";
    }
}
?>

<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Cadastro - PascomHub</title>
</head>
<body>
<h2>Cadastro de Usuário</h2>
<?php if($erro) echo "<p style='color:red'>$erro</p>"; ?>
<?php if($sucesso) echo "<p style='color:green'>$sucesso</p>"; ?>

<form method="POST">
    <label>Nome:</label><br>
    <input type="text" name="nome" required><br>

    <label>Email:</label><br>
    <input type="email" name="email" required><br>

    <label>Senha:</label><br>
    <input type="password" name="senha" required><br>

    <label>Habilidades e Sub-habilidades:</label><br>
    <?php foreach($habilidades as $h): ?>
        <b><?php echo $h['nome']; ?></b><br>
        <input type="checkbox" name="habilidades[]" value="<?php echo $h['habilidadeid']; ?>"> Selecionar habilidade<br>

        <?php foreach($subhabilidades as $s): 
            if($s['habilidadeid'] == $h['habilidadeid']): ?>
            &nbsp;&nbsp;&nbsp;<input type="checkbox" name="subhabilidades[<?php echo $h['habilidadeid']; ?>][]" value="<?php echo $s['subid']; ?>"> <?php echo $s['nome']; ?><br>
        <?php endif; endforeach; ?>
    <?php endforeach; ?>

    <button type="submit">Cadastrar</button>
</form>
<p>Já possui conta? <a href="login.php">Login</a></p>
</body>
</html>