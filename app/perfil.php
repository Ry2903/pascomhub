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
<div style="max-width:700px;margin:40px auto;padding:25px;background-color:#fff;border-radius:15px;box-shadow:0 0 20px rgba(0,0,0,0.2);">

    <h2 style="text-align:center;color:#FFD700;">Perfil de <?php echo htmlspecialchars($usuario['nome']); ?></h2>
    
    <p><strong>Email:</strong> <?php echo htmlspecialchars($usuario['email']); ?></p>
    <p><strong>Tipo:</strong> <?php echo htmlspecialchars($usuario['tipo']); ?></p>

    <h3 style="color:#003366;">Habilidades</h3>
    <ul>
        <?php
        foreach($habilidades as $h) {
            echo "<li>{$h['habilidade']}" . ($h['subhabil'] ? " - {$h['subhabil']}" : "") . "</li>";
        }
        ?>
    </ul>

    <div style="text-align:center;margin-top:20px;">
        <a href="index.php" class="btn-nav">Voltar ao Dashboard</a>
    </div>

</div>
</body>
</html>