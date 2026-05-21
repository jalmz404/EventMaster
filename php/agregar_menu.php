<?php
session_start();
header("Content-Type: application/json");
require_once "conexion.php";

$id_evento = $_POST['id_evento'] ?? null;
$nombre_platillo = $_POST['nombre_platillo'] ?? null;

if (!$id_evento || !$nombre_platillo) {
    echo json_encode(["status" => "error", "message" => "Faltan datos"]); exit;
}

try {
    $query = "INSERT INTO menus (id_evento, nombre_platillo) VALUES (:id_evento, :nombre)";
    $stmt = $conexion->prepare($query);
    $stmt->execute([':id_evento' => $id_evento, ':nombre' => $nombre_platillo]);

    echo json_encode(["status" => "success", "id_menu" => $conexion->lastInsertId(), "nombre" => $nombre_platillo]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Error BD: " . $e->getMessage()]);
}
?>