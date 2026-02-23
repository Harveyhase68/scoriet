<?php
require __DIR__ . '/vendor/autoload.php';

$sqlite = new App\Services\SQLiteParser();
$sql = <<<'SQL'
DROP TABLE IF EXISTS "address";
CREATE TABLE "address" (
	"address_id"	INTEGER,
	"address"	VARCHAR(50) NOT NULL,
	"address2"	VARCHAR(50) DEFAULT NULL,
	"district"	VARCHAR(20) NOT NULL,
	"city_id"	SMALLINT UNSIGNED NOT NULL,
	"postal_code"	VARCHAR(10) DEFAULT NULL,
	"phone"	VARCHAR(20) NOT NULL,
	"last_update"	TIMESTAMP NOT NULL,
	PRIMARY KEY("address_id" AUTOINCREMENT),
	CONSTRAINT "fk_address_city" FOREIGN KEY("city_id") REFERENCES "city"("city_id") ON DELETE RESTRICT ON UPDATE CASCADE
);
SQL;

try {
    $result = $sqlite->parseSQL($sql);
    echo json_encode($result, JSON_PRETTY_PRINT) . "\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
