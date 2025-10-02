import yaml
import json
from pathlib import Path
from typing import Dict, Any

def load_yaml(file_path: str) -> Dict[str, Any]:
    """Load YAML configuration file"""
    path = Path(file_path)
    if not path.exists():
        return {}
    
    with open(path, 'r') as f:
        return yaml.safe_load(f) or {}

def load_json(file_path: str) -> Dict[str, Any]:
    """Load JSON configuration file"""
    path = Path(file_path)
    if not path.exists():
        return {}
    
    with open(path, 'r') as f:
        return json.load(f)