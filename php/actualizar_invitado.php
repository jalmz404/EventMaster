<?php
session_start();
header("Content-Type: application/json");
require_once "conexion.php";

$id_invitado = $_POST['id_invitado'] ?? null;
$nombre_completo = $_POST['nombre_completo'] ?? null;
$id_menu = $_POST['id_menu'] ?? null;

if (!$id_invitado || !$nombre_completo) {
    echo json_encode(["status" => "error", "message" => "Faltan datos obligatorios"]); exit;
}

// Si mandan el menú vacío, lo guardamos como NULL en la BD
if (empty($id_menu)) { $id_menu = null; }

try {
    $query = "UPDATE invitados SET nombre_completo = :nombre, id_menu = :id_menu WHERE id_invitado = :id_invitado";
    $stmt = $conexion->prepare($query);
    $stmt->execute([
        ':nombre' => $nombre_completo,
        ':id_menu' => $id_menu,
        ':id_invitado' => $id_invitado
    ]);

    echo json_encode(["status" => "success", "message" => "Invitado actualizado"]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Error BD: " . $e->getMessage()]);
}
?>