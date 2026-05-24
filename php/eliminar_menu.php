<?php
header('Content-Type: application/json');
require_once "conexion.php";

$id_menu = $_POST['id_menu'] ?? null;

if (!$id_menu) {
    echo json_encode(["status" => "error", "message" => "Falta el ID del menú."]);
    exit;
}

try {
    $query = "DELETE FROM menus WHERE id_menu = :id_menu";
    $stmt = $conexion->prepare($query);
    $stmt->execute([':id_menu' => $id_menu]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(["status" => "success"]);
    } else {
        echo json_encode(["status" => "error", "message" => "El platillo no existe o ya fue eliminado."]);
    }
} catch (PDOException $e) {
    //Si da el error 23000, significa que hay un invitado usando este menu
    if ($e->getCode() == 23000) {
        echo json_encode(["status" => "error", "message" => "No se puede eliminar porque hay invitados que ya seleccionaron este platillo."]);
    } else {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}
?>