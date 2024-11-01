# Dependencies

此目录包含 `ECNU_MMLLM` 项目所需的本地依赖项`flash_attn` 包的本地安装文件，已包含在`requirements.txt`中，无需特别单独安装。

## 目录内容

- `flash_attn-2.6.2+cu123torch2.4cxx11abiFALSE-cp39-cp39-linux_x86_64.whl`：`flash_attn` 的本地依赖包文件，仅适用于 Linux 环境下 Python 3.9 及 CUDA 12.3。

## 安装指南

**整体环境安装**：可通过项目根目录下的`requirements.txt`安装。

**单独安装**：若您要单独安装，在本地安装 `flash_attn` 包时，请确保您在项目根目录，并通过以下命令安装此 `.whl` 文件：

```bash
pip install ./dependencies/flash_attn-2.6.2+cu123torch2.4cxx11abiFALSE-cp39-cp39-linux_x86_64.whl
```

### 注意事项

- 确保本地已配置合适的 CUDA 版本（CUDA 12.3）及 Python 版本（3.9），以避免兼容性问题。
- `flash_attn` 依赖包仅能从本地安装，无法通过 `pip` 直接从线上获取。

