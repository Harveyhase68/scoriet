<?php

namespace App\Services;

class SQLToken {
    public $type;
    public $value;
    public $position;
    
    public function __construct($type, $value, $position) {
        $this->type = $type;
        $this->value = $value;
        $this->position = $position;
    }
    
    public function __toString() {
        return "Token({$this->type}, '{$this->value}')";
    }
}
