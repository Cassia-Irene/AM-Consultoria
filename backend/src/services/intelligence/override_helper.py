import re
from typing import Dict, Optional, Any

class OverrideHelper:
    """
    Auxiliar para extrair overrides manuais do Adriano dos campos de observações.
    
    Tags esperadas: [OVERRIDE_KEY:value]
    Exemplo: [OVERRIDE_PERFIL:estável] [OVERRIDE_MOTIVO:Contrato pausado por auditoria]
    """
    
    @staticmethod
    def parse_overrides(text: Optional[str]) -> Dict[str, str]:
        if not text:
            return {}
        
        matches = re.findall(r'\[OVERRIDE_(.*?):(.*?)\]', text)
        return {key.lower(): value.strip() for key, value in matches}

    @staticmethod
    def get_override(text: Optional[str], key: str, default: Any = None) -> Any:
        overrides = OverrideHelper.parse_overrides(text)
        return overrides.get(key.lower(), default)

    @staticmethod
    def clean_text(text: Optional[str]) -> str:
        """Remove as tags de override para exibição limpa no frontend."""
        if not text:
            return ""
        return re.sub(r'\[OVERRIDE_.*?:.*?\]', '', text).strip()
