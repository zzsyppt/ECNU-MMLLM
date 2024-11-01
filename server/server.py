# （或许需要修改）模型地址：
model_id = "/home/pod/shared-nvme/ECNU_MMLLM/llama"

import json
import time
import asyncio
from queue import Queue
from threading import Thread
from contextlib import asynccontextmanager
from typing import List, Literal, Optional, Union
import numpy as np
import torch
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline

# 初始化模型和 tokenizer
model = AutoModelForCausalLM.from_pretrained(model_id, torch_dtype=torch.bfloat16)
model = model.to("cuda")
tokenizer = AutoTokenizer.from_pretrained(model_id)

# FastAPI 配置
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
   #allow_origins=["http://localhost:8000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 定义接收用户心率数据的请求模型
class HeartRateRequest(BaseModel):
    heart_rate_series: str

# 计算 RMSSD
def calculate_rmssd(rr_intervals):
    diff_rr = np.diff(rr_intervals)  # 相邻 R-R 间隔的差
    rmssd = np.sqrt(np.mean(diff_rr**2))  # 差值的均方根
    return rmssd

# 计算 SDNN
def calculate_sdnn(rr_intervals):
    sdnn = np.std(rr_intervals)  # R-R 间隔的标准差
    return sdnn

# 计算 pNN50
def calculate_pnn50(rr_intervals):
    diff_rr = np.diff(rr_intervals)
    nn50 = np.sum(np.abs(diff_rr) > 50)  # 计算相邻间隔差值超过 50 ms 的次数
    pnn50 = (nn50 / len(diff_rr)) * 100  # 超过 50 ms 的差值比例
    return pnn50

# 计算 SN (Sympathetic Nervous Activity Index)
def calculate_sn(rr_intervals):
    sn = np.mean(rr_intervals) / np.std(rr_intervals)  # 平均值与标准差之比
    return sn

# 测试根路径
@app.get("/")
async def read_root():
    return {"message": "欢迎使用多模态心理大模型的 API! 您在根路径。"}


@app.post("/v1/chat/completions")
async def create_chat_completion(request: HeartRateRequest):
    print("Received request:", request)  # 添加日志记录
    try:        
        series = request.heart_rate_series  # 这里得到了心理序列
        heart_rates = np.array([int(x) for x in series.split(",")])
        # 将心率数据转换为 R-R 间隔（毫秒）
        rr_intervals = 60000 / heart_rates  # R-R 间隔（以毫秒为单位）
        # 计算结果
        rmssd = calculate_rmssd(rr_intervals)
        sdnn = calculate_sdnn(rr_intervals)
        pnn50 = calculate_pnn50(rr_intervals)
        sn = calculate_sn(rr_intervals)
        
        sys_prompt = """
        扮演一位心理咨询师，根据用户传入的心率变异性（HRV）指标（RMSSD、SDNN、pNN50 和 SN）以及心率数据来推测用户的心理状态。以下是这四个指标的定义、正常范围及其在心理健康评估中的意义，请结合这些信息进行分析和推理。\n

        1. **RMSSD（均方根差）**：衡量短期心率变异性，主要反映副交感神经（迷走神经）活动水平。正常值为15-39，过低的 RMSSD 表示用户压力较大或情绪波动较大，过高表示用户很轻松放松。\n

        2. **SDNN（NN间隔标准差）**：反映总体心率变异性，受到交感和副交感神经活动的影响。正常值为102-180，过低的SDNN可能提示个体处于高压力状态或心理负担较大，过高表示用户很轻松放松。\n

        3. **pNN50**：表示相邻心跳间隔差值大于 50 毫秒的比例乘100。健康人群的 pNN50 值一般在 2% 到 8% 之间，较高的 pNN50 表明情绪稳定、压力较低，而较低的 pNN50 可能提示用户情绪不稳或处于紧张状态。\n

        4. **SN（交感神经活动指数）**：衡量交感神经系统的活跃程度。SN 值超过 15 用户则可能压力或焦虑。\n

        ### 请综合以上指标数值和心率数据推测用户的下列心理指标。\n

        请返回一个只包含以下键值对的 JSON 对象，不需要任何其他文字：\n
        1. "RMSSD": 原封不动放置 RMSSD 的值。\n
        2. "SDNN": 原封不动放置 SDNN 的值。\n
        3. "pNN50": 原封不动放置 pNN50 的值。\n
        4. "SN": 原封不动放置 SN 的值。\n
        5. "心情状态": 用一个词描述用户的心情状态。\n
        6. "心情颜色": 能代表用户心情状态的16进制颜色编码。\n
        7. "总能量星级": 用户的整体能量评级，介于 1 到 5。\n
        8. "放松度星级": 用户的放松程度评级，介于 1 到 5。\n
        9. "压力指数星级": 用户的压力水平评级，介于 1 到 5。\n
        10. "情绪稳定性星级": 用户的情绪稳定性评级，介于 1 到 5。\n
        11. "心理弹性星级": 用户的心理弹性评级，介于 1 到 5。\n
        12. "身心和谐度星级": 用户的身心和谐程度评级，介于 1 到 5。\n
        13. "综合得分": 用户的综合得分，介于 20 到 100。\n
        14. "焦虑指数": 用户的焦虑水平评级，介于 1 到 5。\n
        15. "疲劳指数": 用户的疲劳水平评级，介于 1 到 5。\n
        16. "建议": 根据你所分析的用户心情状态，给出一些调整状态的建议。\n

        请严格遵循格式，返回的必须是json对象，不要添加任何其他内容。我再次强调：必须返回含大括号的json对象。\n
        """
        usr_prompt = f"""
        这是我的心率变异性数据以及心率数据：\n
        1. "RMSSD": {rmssd}\n
        2. "SDNN": {sdnn}\n
        3. "pNN50": {pnn50}\n
        4. "SN": {sn}\n
        5. "原始心率数据": {series}
        """

        #使用特殊标记标记prompt结束
        usr_prompt += "<|endofprompt|>"
        messages = [
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": usr_prompt},
        ]

        # 使用 tokenizer 将 prompt 转化为模型输入
        prompt = tokenizer.apply_chat_template(
            messages, 
            tokenize=False, 
            add_generation_prompt=True
        )
        
        # 配置生成参数
        retries = 10  # 设置最大重试次数
        # 设置 pad_token_id
        model.config.pad_token_id = model.config.eos_token_id

        for attempt in range(retries):
            print("正在请求")
            outputs = model.generate(
                **tokenizer(prompt, return_tensors="pt").to("cuda"),
                max_new_tokens=1024,
                eos_token_id=model.config.eos_token_id,
                pad_token_id=model.config.pad_token_id,
                do_sample=True,
                temperature=0.6,
                top_p=0.9,
            )
            print("请求结束")
            # 解码并返回生成结果
            generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
            # 寻找标记位置 这与llama的生成有关
            start_index = generated_text.find("<|endofprompt|>") + len("<|endofprompt|>assistant\n\n")
            generated_text = generated_text[start_index:]
            # print("生成的文字：\n"+generated_text)
            # 尝试将生成的文本解析为 JSON
            try:
                json_response = json.loads(generated_text)
                print("解析后的json对象"+str(json_response))
                return json_response  # 直接返回解析后的 JSON 对象
            except json.JSONDecodeError:
                if attempt < retries - 1:  # 如果还可以重试
                    print(f"第 {attempt + 1} 次解析失败，正在重新请求大模型...")
                    continue  # 重新请求
                else:
                    # 达到最大重试次数后，返回错误信息
                    print("大模型多次返回格式错误")
                    raise HTTPException(status_code=500, detail="多次请求后仍然无法解析生成的内容为有效的 JSON 格式")

    except Exception as e:
        print("There occured an error: "+str(e))
        raise HTTPException(status_code=500, detail=str(e))


# 启动 API 服务器
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=6007)
