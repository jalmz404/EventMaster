<?php
session_start();
header("Content-Type: application/json");
require_once "conexion.php";

$id_invitado = $_POST['id_invitado'] ?? null;

if (!$id_invitado) {
    echo json_encode(["status" => "error", "message" => "ID no proporcionado"]); exit;
}

try {
    $query = "DELETE FROM invitados WHERE id_invitado = :id_invitado";
    $stmt = $conexion->prepare($query);
    $stmt->execute([':id_invitado' => $id_invitado]);
    
    echo json_encode(["status" => "success", "message" => "Invitado eliminado"]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Error BD: " . $e->getMessage()]);
}
?>