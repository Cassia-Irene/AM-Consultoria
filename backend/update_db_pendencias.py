import os
import sys

# Adiciona o diretório backend ao sys.path para importações locais
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.database import SessionLocal
from src.models.pendencia import Pendencia

def run_update():
    db = SessionLocal()
    try:
        pendencias = db.query(Pendencia).all()
        updated_count = 0
        print(f"[MIGRATION] Iniciando varredura em {len(pendencias)} pendências no banco de dados...")
        
        for p in pendencias:
            original = p.responsavel
            
            # Se for Adriano ou variação, vira 'AM Consultoria'
            if original in ["Adriano", "Responsável: Adriano"]:
                p.responsavel = "AM Consultoria"
                updated_count += 1
                print(f"  [RETIFY] Pendência #{p.id_pendencia} ({p.descricao[:30]}...): '{original}' -> 'AM Consultoria'")
            # Se for qualquer outra coisa diferente de AM Consultoria, vira 'Equipe Cliente'
            elif original != "AM Consultoria":
                p.responsavel = "Equipe Cliente"
                updated_count += 1
                print(f"  [RETIFY] Pendência #{p.id_pendencia} ({p.descricao[:30]}...): '{original}' -> 'Equipe Cliente'")
                
        if updated_count > 0:
            db.commit()
            print(f"[MIGRATION] Sucesso! {updated_count} registros de pendências foram higienizados e persistidos no PostgreSQL.")
        else:
            print("[MIGRATION] Nenhuma pendência precisou de atualização. Banco de dados já higienizado.")
            
    except Exception as e:
        db.rollback()
        print(f"[MIGRATION][ERROR] Erro durante a transação de atualização: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run_update()
