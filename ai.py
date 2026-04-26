from openai import OpenAI
import os

# 配置客户端
client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",  # 固定地址
    api_key=os.getenv("NVIDIA_API_KEY", "nvapi-")  # 替换为你的Key
)

def query_nim_model(prompt, model="z-ai/glm4.7", max_tokens=1024):
    """
    调用英伟达NIM大模型
    
    参数:
        prompt: 用户输入的提示词
        model: 模型ID，默认为GLM-4.7
        max_tokens: 最大输出长度
    
    返回:
        模型生成的文本
    """
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,  # 控制随机性，0-1之间
            max_tokens=max_tokens,
            stream=False  # 设为True可流式输出
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"调用失败: {str(e)}"

# 使用示例
if __name__ == "__main__":
    print(os.getenv("NVIDIA_API_KEY"))
    result = query_nim_model("你好")
    print(result)