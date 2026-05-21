<?php
header("Content-Type: application/json");
require_once "conexion.php";

$id_evento = $_GET['id_evento'] ?? null;

if (!$id_evento) {
    echo json_encode(["status" => "error", "message" => "Falta ID de evento"]); exit;
}

try {
    //Traer datos del evento
    $qEvento = "SELECT nombre, lugar, fecha, hora, titulo_invitacion, mensaje_invitacion FROM eventos WHERE id_evento = :id_evento";
    $stmtE = $conexion->prepare($qEvento);
    $stmtE->execute([':id_evento' => $id_evento]);
    $evento = $stmtE->fetch(PDO::FETCH_ASSOC);

    //Traer los menus disponibles
    $qMenus = "SELECT id_menu, nombre_platillo FROM menus WHERE id_evento = :id_evento";
    $stmtM = $conexion->prepare($qMenus);
    $stmtM->execute([':id_evento' => $id_evento]);
    $menus = $stmtM->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["status" => "success", "evento" => $evento, "menus" => $menus]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>