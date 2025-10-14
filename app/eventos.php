<?php
session_start();
require 'conexao.php';

if (!isset($_SESSION['userid'])) {
    header('Location: login.php');
    exit;
}

$userid = $_SESSION['userid'];
$tipo = $_SESSION['tipo'];
$msg = '';

// ------------------ RESERVAR FUNÇÃO ------------------
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

// ------------------ FILTRAGEM ------------------
$filterHabilidade = $_GET['habilidade'] ?? '';
$filterSub = $_GET['subhabilidade'] ?? '';

// Monta query dinâmica para filtro
$query = "SELECT * FROM eventos WHERE 1=1";
$params = [];

if ($filterHabilidade) {
    $query .= " AND eventoid IN (SELECT eventoid FROM funcoesevento WHERE habilidadeid = ?)";
    $params[] = $filterHabilidade;
}

$eventos = $pdo->prepare($query . " ORDER BY data ASC, horario ASC");
$eventos->execute($params);
$eventos = $eventos->fetchAll();

// ------------------ LISTA DE HABILIDADES PARA FILTRO ------------------
$habilidades = $pdo->query("SELECT * FROM habilidades")->fetchAll();
$subhabilidades = $pdo->query("SELECT * FROM subhabilidade")->fetchAll();

// ------------------ ADICIONAR FUNÇÃO (SOMENTE COORDENADOR) ------------------
if ($tipo === 'Coordenador' && $_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['addFuncao'])) {
    $eventoid = $_POST['eventoid'];
    $habilidadeid = $_POST['habilidadeid'];
    $subid = $_POST['subid'] ?: null;

    $stmt = $pdo->prepare("INSERT INTO funcoesevento (eventoid, habilidadeid, subid) VALUES (?, ?, ?)");
    $stmt->execute([$eventoid, $habilidadeid, $subid]);
    $msg = "Função adicionada com sucesso!";
}

// ------------------ REMOVER FUNÇÃO (SOMENTE COORDENADOR) ------------------
if ($tipo === 'Coordenador' && isset($_GET['delete']) && isset($_GET['funcaoid'])) {
    $funcaoid = intval($_GET['funcaoid']);
    $stmt = $pdo->prepare("DELETE FROM funcoesevento WHERE funcaoid = ?");
    $stmt->execute([$funcaoid]);
    $msg = "Função removida!";
}
?>

<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Eventos - PascomHub</title>
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
<h2>Eventos</h2>
<?php if($msg) echo "<p>$msg</p>"; ?>

<nav>
    <a href="index.php">Dashboard</a> |
    <a href="perfil.php">Perfil</a> |
    <a href="logout.php">Sair</a>
</nav>

<!-- FILTRO -->
<form method="GET">
    <label>Filtrar por habilidade:</label>
    <select name="habilidade">
        <option value="">Todas</option>
        <?php foreach($habilidades as $h): ?>
            <option value="<?php echo $h['habilidadeid']; ?>" <?php if($filterHabilidade == $h['habilidadeid']) echo 'selected'; ?>>
                <?php echo $h['nome']; ?>
            </option>
        <?php endforeach; ?>
    </select>

    <label>Filtrar por sub-habilidade:</label>
    <select name="subhabilidade">
        <option value="">Todas</option>
        <?php foreach($subhabilidades as $s): ?>
            <option value="<?php echo $s['subid']; ?>" <?php if($filterSub == $s['subid']) echo 'selected'; ?>>
                <?php echo $s['nome']; ?>
            </option>
        <?php endforeach; ?>
    </select>

    <button type="submit">Filtrar</button>
</form>

<?php foreach($eventos as $evento): ?>
    <hr>
    <h3><?php echo $evento['descricao'] ?? 'Sem descrição'; ?></h3>
    <p>Data: <?php echo date('d/m/Y', strtotime($evento['data'])); ?> | Horário: <?php echo $evento['horario']; ?></p>

    <?php
    $sqlFuncoes = "
        SELECT f.funcaoid, h.nome AS habilidade, s.nome AS subhabilidade, u.nome AS responsavel, f.status
        FROM funcoesevento f
        INNER JOIN habilidades h ON f.habilidadeid = h.habilidadeid
        LEFT JOIN subhabilidade s ON f.subid = s.subid
        LEFT JOIN usuarios u ON f.idresponsavel = u.userid
        WHERE f.eventoid =  ?";
    
    $stmt = $pdo->prepare($sqlFuncoes);
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
                        <?php if($tipo === 'Coordenador'): ?>
                            <a href="?delete=1&funcaoid=<?php echo $f['funcaoid']; ?>">Remover</a>
                        <?php elseif($f['status'] === 'Livre'): ?>
                            <a href="?reserva=<?php echo $f['funcaoid']; ?>">Reservar</a>
                        <?php else: ?>
                            -
                        <?php endif; ?>
                    </td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>

    <?php if($tipo === 'Coordenador'): ?>
        <h4>Adicionar função</h4>
        <form method="POST">
            <input type="hidden" name="eventoid" value="<?php echo $evento['eventoid']; ?>">
            <label>Habilidade:</label>
            <select name="habilidadeid" required>
                <?php foreach($habilidades as $h): ?>
                    <option value="<?php echo $h['habilidadeid']; ?>"><?php echo $h['nome']; ?></option>
                <?php endforeach; ?>
            </select>

            <label>Sub-habilidade (opcional):</label>
            <select name="subid">
                <option value="">Nenhuma</option>
                <?php foreach($subhabilidades as $s): ?>
                    <option value="<?php echo $s['subid']; ?>"><?php echo $s['nome']; ?></option>
                <?php endforeach; ?>
            </select>

            <button type="submit" name="addFuncao">Adicionar</button>
        </form>
    <?php endif; ?>
<?php endforeach; ?>
</body>
</html>
