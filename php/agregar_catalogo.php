<?php
session_start();
header("Content-Type: application/json");
require_once "conexion.php";

$tipo_catalogo = $_POST['tipo_catalogo'] ?? null; 
$nombre = $_POST['nombre'] ?? null;

$id_organizador = $_SESSION['id_organizador'] ?? null;

if (!$tipo_catalogo || !$nombre || !$id_organizador) {
    echo json_encode(["status" => "error", "message" => "Faltan datos o no hay sesión activa"]); 
    exit;
}

try {
    if ($tipo_catalogo === 'tipo_evento') {
        $query = "INSERT INTO tipos_evento (nombre_tipo, id_organizador) VALUES (:nombre, :id_organizador)";
    } else {
        $query = "INSERT INTO tipos_vestimenta (nombre_vestimenta, id_organizador) VALUES (:nombre, :id_organizador)";
    }

    $stmt = $conexion->prepare($query);
    
    $stmt->execute([
        ':nombre' => $nombre,
        ':id_organizador' => $id_organizador
    ]);

    echo json_encode(["status" => "success", "id" => $conexion->lastInsertId(), "nombre" => $nombre]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Error BD: " . $e->getMessage()]);
}
?>