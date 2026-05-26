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
    $query = "SELECT i.*, 
                     m.nombre_platillo, 
                     p.nombre_completo AS nombre_titular,
                     CONCAT('Mesa ', ms.numero_mesa) AS nombre_mesa 
              FROM invitados i 
              LEFT JOIN menus m ON i.id_menu = m.id_menu 
              LEFT JOIN invitados p ON i.id_invitado_principal = p.id_invitado 
              LEFT JOIN mesas ms ON i.id_mesa = ms.id_mesa
              WHERE i.id_evento = :id_evento 
              ORDER BY i.id_invitado ASC";
              
    $stmt = $conexion->prepare($query);
    $stmt->execute([':id_evento' => $id_evento]);
    $invitados = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["status" => "success", "data" => $invitados]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => "Error BD: " . $e->getMessage()]);
}
?>