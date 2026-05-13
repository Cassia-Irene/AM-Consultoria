from pydantic import BaseModel, EmailStr
from typing import Optional

class Contato(BaseModel):
    email: Optional[EmailStr] = None

names = [
    "Conceição Ribeiro",
    "Patrícia Ribeiro",
    "Dr. Álvaro Mendes",
    "Dra. Fernanda Caldas",
    "Rosângela Teixeira",
    "Neuza Farias"
]

for name in names:
    safe_name = name.lower().replace('ç', 'c').replace('ã', 'a').replace('í', 'i').replace('á', 'a').replace('é', 'e').replace(' ', '.')
    safe_name = "".join(x for x in safe_name if x.isalnum() or x == '.')
    # Collapse double dots
    while '..' in safe_name:
        safe_name = safe_name.replace('..', '.')
    # Remove leading/trailing dots
    safe_name = safe_name.strip('.')
    
    email = f"{safe_name}@cliente.com"
    try:
        Contato(email=email)
        print(f"OK: {name} -> {email}")
    except Exception as e:
        print(f"FAIL: {name} -> {email} | {e}")
