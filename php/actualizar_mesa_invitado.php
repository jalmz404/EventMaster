<?php
session_start();
header("Content-Type: application/json");
require_once "conexion.php";

$id_invitado = $_POST['id_invitado'] ?? null;
$id_mesa = !empty($_POST['id_mesa']) ? $_POST['id_mesa'] : null;

if (!$id_invitado) {
    echo json_encode(["status" => "error", "message" => "ID de invitado no proporcionado"]); 
    exit;
}

try {
    $query = "UPDATE invitados SET id_mesa = :id_mesa WHERE id_invitado = :id_invitado";
    $stmt = $conexion->prepare($query);
    $stmt->execute([
        ':id_mesa' => $id_mesa,
        ':id_invitado' => $id_invitado
    ]);

    echo json_encode(["status" => "success", "message" => "Mesa actualizada correctamente"]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Error BD: " . $e->getMessage()]);
}
?>