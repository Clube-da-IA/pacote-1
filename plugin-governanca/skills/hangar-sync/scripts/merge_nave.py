#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HANGAR · merge_nave.py — encaixa (upsert) UMA nave no dados-hangar.json com segurança.

Por que existe: o dados-hangar.json é a FONTE ÚNICA DA VERDADE do app HANGAR (o
app lê e escreve nele). Editar 30 KB de JSON na mão é arriscado — um erro
apaga as outras naves. Este script faz o encaixe do mesmo jeito seguro que o
próprio app faz: backup antes, escrita atômica, e merge POR id (nunca duplica).

O que ele NÃO faz: montar a nave. A nave (o mapeamento projeto→ficha) é trabalho
de julgamento da skill; aqui só entra o encaixe seguro de um objeto já pronto.

Uso:
  python3 merge_nave.py --catalog CAMINHO/dados-hangar.json --nave CAMINHO/nave.json
  python3 merge_nave.py --catalog ... --nave ... --dry-run     # não grava, só mostra

Saída: um resumo legível (JSON no stdout) — ação (criada/atualizada), id, nome,
versão, custo mensal da nave, e total de naves depois. Código de saída != 0 se algo
impediria uma gravação segura (assim a skill NÃO diz 'pronto' em cima de erro).
"""
import argparse
import datetime
import json
import os
import sys


def carregar_json(caminho):
    with open(caminho, "r", encoding="utf-8") as f:
        return json.load(f)


def custo_mensal(nave):
    total = 0.0
    for c in nave.get("custos", []) or []:
        try:
            total += float(c.get("valorMensal") or 0)
        except (TypeError, ValueError):
            pass
    return total


def erro(msg):
    print(json.dumps({"ok": False, "erro": msg}, ensure_ascii=False, indent=2))
    sys.exit(1)


def main():
    ap = argparse.ArgumentParser(description="Encaixa uma nave no dados-hangar.json com backup + escrita atomica.")
    ap.add_argument("--catalog", required=True, help="Caminho do dados-hangar.json (a frota).")
    ap.add_argument("--nave", required=True, help="Caminho de um .json com UMA nave (o objeto ja montado).")
    ap.add_argument("--dry-run", action="store_true", help="Nao grava — so mostra o que faria.")
    args = ap.parse_args()

    if not os.path.exists(args.catalog):
        erro(f"Nao achei o catalogo em {args.catalog}. Aponte o dados-hangar.json do HANGAR.")
    if not os.path.exists(args.nave):
        erro(f"Nao achei o arquivo da nave em {args.nave}.")

    try:
        catalogo = carregar_json(args.catalog)
    except json.JSONDecodeError as e:
        erro(f"O catalogo nao e um JSON valido ({e}). Nao vou gravar em cima de um arquivo quebrado.")
    try:
        nave = carregar_json(args.nave)
    except json.JSONDecodeError as e:
        erro(f"O arquivo da nave nao e um JSON valido ({e}).")

    # O catalogo TEM que ter a lista 'naves' — mesma checagem do app (persistencia.js).
    if not isinstance(catalogo, dict) or not isinstance(catalogo.get("naves"), list):
        erro("Esse arquivo nao parece um dados-hangar.json (faltou a lista 'naves').")

    nave_id = (nave.get("id") or "").strip()
    if not nave_id:
        erro("A nave nao tem 'id'. O id e o apelido unico (ex.: 'agenda-da-clinica'), sem espaco.")
    if " " in nave_id:
        erro(f"O id '{nave_id}' tem espaco. Use um apelido sem espaco (ex.: 'ai-health-digest').")

    naves = catalogo["naves"]
    idx = next((i for i, n in enumerate(naves) if (n.get("id") or "").strip() == nave_id), None)
    acao = "atualizada" if idx is not None else "criada"

    antes = len(naves)
    if idx is not None:
        naves[idx] = nave
    else:
        naves.append(nave)
    catalogo["atualizadoEm"] = datetime.date.today().isoformat()

    resumo = {
        "ok": True,
        "acao": acao,
        "id": nave_id,
        "nome": nave.get("nome"),
        "versao": (nave.get("git") or {}).get("ultimaVersao"),
        "custoMensalDaNave": custo_mensal(nave),
        "moeda": ((nave.get("custos") or [{}])[0].get("moeda") if nave.get("custos") else None),
        "navesAntes": antes,
        "navesDepois": len(naves),
        "atualizadoEm": catalogo["atualizadoEm"],
        "dryRun": bool(args.dry_run),
    }

    if args.dry_run:
        print(json.dumps(resumo, ensure_ascii=False, indent=2))
        return

    # Rede de seguranca 1: backup ao lado, mesmo nome que o app usa.
    backup = os.path.join(os.path.dirname(os.path.abspath(args.catalog)), "dados-hangar.backup.json")
    with open(backup, "w", encoding="utf-8") as f:
        json.dump(carregar_json(args.catalog), f, ensure_ascii=False, indent=2)
        f.write("\n")

    # Rede de seguranca 2: escrita atomica (.tmp -> rename) — nunca deixa o arquivo pela metade.
    tmp = args.catalog + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(catalogo, f, ensure_ascii=False, indent=2)
        f.write("\n")
    os.replace(tmp, args.catalog)

    resumo["backup"] = backup
    print(json.dumps(resumo, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
