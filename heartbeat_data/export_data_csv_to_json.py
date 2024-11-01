import pandas as pd

# 读取数据
file_path = 'heartbeat_and_indicators_data.csv'
data = pd.read_csv(file_path, encoding='GBK')

# 转换为 JSON 格式
json_output = data.to_dict(orient='records')

# 导出为 JSON 文件
output_path = 'heartbeat_and_indicators_data.json'
with open(output_path, 'w', encoding='utf-8') as f:
    import json
    json.dump(json_output, f, ensure_ascii=False, indent=4)

print(f"数据已成功导出到 {output_path}")