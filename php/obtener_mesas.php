<?php
session_start();
header("Content-Type: application/json");
require_once "conexion.php";

$id_evento = $_GET['id_evento'] ?? null;

if (!$id_evento) {
    echo json_encode(["status" => "error", "message" => "ID de evento no proporcionado"]);
    exit;
}

try {
    $query = "SELECT * FROM mesas WHERE id_evento = :id_evento ORDER BY numero_mesa ASC";
    $stmt = $conexion->prepare($query);
    $stmt->execute([':id_evento' => $id_evento]);
    $mesas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["status" => "success", "data" => $mesas]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Error BD: " . $e->getMessage()]);
}
?>