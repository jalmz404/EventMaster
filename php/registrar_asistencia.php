<?php
header("Content-Type: application/json");
require_once "conexion.php";

$id_evento = $_POST['id_evento'] ?? null;
$principal = $_POST['principal'] ?? null; //trae nombre e id_menu
$acompanantes = $_POST['acompanantes'] ?? []; //Arreglo de acompañantes

if (!$id_evento || !$principal) {
    echo json_encode(["status" => "error", "message" => "Datos incompletos"]); exit;
}

try {
    $conexion->beginTransaction();

    //Guardar invitado principal
    $qPrincipal = "INSERT INTO invitados (id_evento, nombre_completo, id_menu, id_invitado_principal) VALUES (:id_evento, :nombre, :id_menu, NULL)";
    $stmtP = $conexion->prepare($qPrincipal);
    $stmtP->execute([
        ':id_evento' => $id_evento,
        ':nombre' => $principal['nombre'],
        ':id_menu' => $principal['id_menu']
    ]);
    
    //obtenemos su ID para unir los acompañantes
    $id_padre = $conexion->lastInsertId();

    //Guardar acompañantes 
    if (!empty($acompanantes)) {
        $qAcomp = "INSERT INTO invitados (id_evento, nombre_completo, id_menu, id_invitado_principal) VALUES (:id_evento, :nombre, :id_menu, :id_padre)";
        $stmtA = $conexion->prepare($qAcomp);
        
        foreach ($acompanantes as $ac) {
            $stmtA->execute([
                ':id_evento' => $id_evento,
                ':nombre' => $ac['nombre'],
                ':id_menu' => $ac['id_menu'],
                ':id_padre' => $id_padre
            ]);
        }
    }

    $conexion->commit();
    echo json_encode(["status" => "success", "message" => "Confirmación exitosa"]);

} catch (PDOException $e) {
    $conexion->rollBack();
    echo json_encode(["status" => "error", "message" => "Error BD: " . $e->getMessage()]);
}
?>