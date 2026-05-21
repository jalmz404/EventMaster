<?php
require_once "conexion.php";
$id_evento = $_GET['id_evento'] ?? null;

if (!$id_evento) {
    die("ID de evento requerido");
}

header("Content-Type: application/vnd.ms-excel; charset=utf-8");
header("Content-Disposition: attachment; filename=Lista_Invitados.xls");
header("Expires: 0");
header("Cache-Control: must-revalidate, post-check=0, pre-check=0");

try {
    $query = "SELECT i.*, m.nombre_platillo 
              FROM invitados i 
              LEFT JOIN menus m ON i.id_menu = m.id_menu 
              WHERE i.id_evento = :id_evento 
              ORDER BY i.nombre_completo ASC";
    $stmt = $conexion->prepare($query);
    $stmt->execute([':id_evento' => $id_evento]);
    $invitados = $stmt->fetchAll(PDO::FETCH_ASSOC);

    //Imprimir el formato BOM para que Excel reconozca los acentos
    echo "\xEF\xBB\xBF";
    
    //Armamos la tabla
    echo "<table border='1'>";
    echo "<tr style='background-color: #f8f9fa; font-weight: bold;'>
            <th>Nombre Completo</th>
            <th>Tipo</th>
            <th>Menú</th>
            <th>Mesa</th>
          </tr>";
    
    foreach ($invitados as $inv) {
        $tipo = $inv['id_invitado_principal'] ? 'Acompañante' : 'Principal';
        $menu = $inv['nombre_platillo'] ? $inv['nombre_platillo'] : 'Por definir';
        $mesa = 'S/A';
        
        echo "<tr>";
        echo "<td>" . htmlspecialchars($inv['nombre_completo']) . "</td>";
        echo "<td>" . $tipo . "</td>";
        echo "<td>" . $menu . "</td>";
        echo "<td>" . $mesa . "</td>";
        echo "</tr>";
    }
    echo "</table>";

} catch (PDOException $e) {
    echo "Error BD: " . $e->getMessage();
}
?>