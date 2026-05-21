<?php
session_start();
header("Content-Type: application/json");
require_once "conexion.php";

$id_evento = $_POST['id_evento'] ?? null;
if (!$id_evento) { echo json_encode(["status" => "error", "message" => "ID no proporcionado"]); exit; }

try {
    $query = "DELETE FROM eventos WHERE id_evento = :id_evento AND id_organizador = :id_organizador";
    $stmt = $conexion->prepare($query);
    $stmt->execute([':id_evento' => $id_evento, ':id_organizador' => $_SESSION['id_organizador']]);

    echo json_encode(["status" => "success", "message" => "Evento eliminado"]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Error BD: " . $e->getMessage()]);
}
?>