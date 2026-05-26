<?php
header('Content-Type: application/json');
require_once "conexion.php"; 

$correo = $_POST['correo'] ?? '';
$password = $_POST['password'] ?? '';


if (empty($correo) || empty($password)) {
    echo json_encode(["status" => "error", "message" => "Todos los campos son obligatorios."]);
    exit;
}

try {
    $stmtCheck = $conexion->prepare("SELECT id_organizador FROM organizadores WHERE correo = :correo");
    $stmtCheck->execute([':correo' => $correo]);
    
    if ($stmtCheck->rowCount() > 0) {
        echo json_encode(["status" => "error", "message" => "Este correo ya está registrado en el sistema."]);
        exit;
    }

    $password_encriptada = password_hash($password, PASSWORD_DEFAULT);

    $query = "INSERT INTO organizadores (correo, password) VALUES (:correo, :password)";
    $stmt = $conexion->prepare($query);
    $stmt->execute([
        ':correo' => $correo,
        ':password' => $password_encriptada
    ]);

    echo json_encode(["status" => "success"]);

} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Error al guardar en BD: " . $e->getMessage()]);
}
?>