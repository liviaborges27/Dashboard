Relatório de Validação Lógica - ONI Intelligence
Objetivo: Validar integridade matemática e estrutura de dados para o Dashboard Front-end.

---
 1. Validação de SLA (Service Level Agreement)
**Objetivo:** Verificar se a taxa de sucesso dos jobs de backup atinge o KPI mínimo de 95%.

### Script de Validação
```python
total_jobs = 86942
falhas_avisos = 2608
meta_sla = 95.0

sucessos = total_jobs - falhas_avisos
percentual_sucesso = (sucessos / total_jobs) * 100

status = "✅ DENTRO DA META" if percentual_sucesso >= meta_sla else "❌ ABAIXO DA META"

print(f"Total de Jobs: {total_jobs}")
print(f"SLA Calculado: {percentual_sucesso:.2f}%")
print(f"Status: {status}")

Saída do Terminal

Total de Jobs: 86942
SLA Calculado: 97.00%
Status: ✅ DENTRO DA META

2. Capacity Planning (Repositório)

Objetivo: Calcular o armazenamento (dias restantes) com base em
volumetria PB/TB e taxa de crescimento diária.

Script de Validação

total_tb = 1420  # 1.42 PB
usado_tb = 1065  # 75% de uso
crescimento_diario_tb = 15

disponivel_tb = total_tb - usado_tb
dias_restantes = disponivel_tb / crescimento_diario_tb

print(f"Capacidade Total: {total_tb} TB")
print(f"Uso Atual: {usado_tb} TB (75%)")
print(f"Dias até 100%: {int(dias_restantes)} dias")

Saída do Terminal

Capacidade Total: 1420 TB
Uso Atual: 1065 TB (75%)
Dias até 100%: 23 dias

3. Estrutura de Telemetria (JSON)

Objetivo: Validar o esquema de dados do array de latência para plotagem de
gráficos temporais.

Script de Validação

import json

# Simulação de 13 amostras (1 spike central de 16.4ms)
leituras = [4.2, 3.8, 4.1, 3.9, 4.5, 4.0, 16.4, 4.3, 4.1, 3.7, 4.2, 3.9, 4.0]

telemetria = {
    "sensor": "ICMP_Latency_Ping",
    "unidade": "ms",
    "quantidade_amostras": len(leituras),
    "data_points": leituras
}

print(json.dumps(telemetria, indent=4))

Saída do Terminal

{
    "sensor": "ICMP_Latency_Ping",
    "unidade": "ms",
    "quantidade_amostras": 13,
    "data_points": [
        4.2,
        3.8,
        4.1,
        3.9,
        4.5,
        4.0,
        16.4,
        4.3,
        4.1,
        3.7,
        4.2,
        3.9,
        4.0
    ]
}

📋 Conclusão do Engenheiro de Qualidade

| Teste                 | Resultado | Observação                                                  |
| :-------------------- | :-------- | :---------------------------------------------------------- |
| **SLA de Backup**     | 🟢 PASSOU  | 97% de aproveitamento (Meta: 95%).                          |
| **Capacity Planning** | 🟡 ALERTA  | Esgotamento em 23 dias. Provisionar expansão.               |
| **Estrutura JSON**    | 🟢 PASSOU  | Estrutura de array compatível com a biblioteca de gráficos. |

Parecer Técnico: A lógica está aprovada para integração com o Front-end.

