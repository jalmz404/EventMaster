<?php
session_start();
header("Content-Type: application/json");
require_once "conexion.php";

$id_mesa = $_POST['id_mesa'] ?? null;

if (!$id_mesa) {
    echo json_encode(["status" => "error", "message" => "ID de mesa no proporcionado"]); exit;
}

try {
    //Liberar a los invitados 
    $query_inv = "UPDATE invitados SET id_mesa = NULL WHERE id_mesa = :id_mesa";
    $stmt_inv = $conexion->prepare($query_inv);
    $stmt_inv->execute([':id_mesa' => $id_mesa]);

    //Eliminar mesa
    $query = "DELETE FROM mesas WHERE id_mesa = :id_mesa";
    $stmt = $conexion->prepare($query);
    $stmt->execute([':id_mesa' => $id_mesa]);

    echo json_encode(["status" => "success", "message" => "Mesa eliminada"]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Error BD: " . $e->getMessage()]);
}
?>