import { Button, Card, Form, Input, InputNumber, Radio, Select, Slider, Space } from "antd";
import { ThunderboltOutlined } from "@ant-design/icons";
import type { FormInstance, UploadFile } from "antd";

import {
  ATTRIBUTE_EDIT_PROMPT_PLACEHOLDER,
  DEEPFAKE_DEFAULT_FUNCTION,
  DEEPFAKE_DEFAULT_MODEL,
  DEEPFAKE_FUNCTION_OPTIONS,
  DEFAULT_MODEL_OPTION_INDEX,
  DEFAULT_SEEDEDIT_SCALE,
  DEFAULT_SEEDEDIT_SEED,
  DEFAULT_SEEDEDIT_SEED_MODE,
  DEEPFAKE_MODEL_OPTIONS,
  DEEPFAKE_TARGET_TOOLTIPS,
  EMPTY_UPLOAD_COUNT,
  FACE_ANIMATION_DEFAULT_PROMPT,
  FACE_ANIMATION_PROMPT_MAX_LENGTH,
  MAX_SEEDEDIT_SCALE,
  MAX_SEEDEDIT_SEED,
  MEDIUM_TEXTAREA_ROWS,
  MIN_SEEDEDIT_SCALE,
  MIN_SEEDEDIT_SEED,
  PROMPT_MAX_LENGTH,
  SEEDEDIT_SCALE_STEP,
  SEEDEDIT_SEED_MODE_OPTIONS,
  SHORT_TEXTAREA_ROWS,
} from "@/constants/generate";
import type { IDeepfakeFormValues, TDeepfakeFunction, TDeepfakeModel } from "@/typings/generate";
import { ImageUploadField } from "@/components/Generation/common/ImageUploadField";
import { DeepfakeCapabilityIntroCard } from "@/components/Generation/Deepfake/DeepfakeCapabilityIntroCard";
import { FaceSwapModelIntroCard } from "@/components/Generation/Deepfake/FaceSwapModelIntroCard";

const { TextArea } = Input;

export interface IDeepfakeGenerateFormProps {
  form: FormInstance<IDeepfakeFormValues>;
  functionType: TDeepfakeFunction;
  selectedModel: TDeepfakeModel;
  targetFile: UploadFile[];
  sourceFile: UploadFile[];
  loading: boolean;
  setFunctionType: (value: TDeepfakeFunction) => void;
  setTargetFile: (files: UploadFile[]) => void;
  setSourceFile: (files: UploadFile[]) => void;
  onPreview: (file: UploadFile) => void;
  onGenerate: () => void;
}

export const DeepfakeGenerateForm = ({
  form,
  functionType,
  selectedModel,
  targetFile,
  sourceFile,
  loading,
  setFunctionType,
  setTargetFile,
  setSourceFile,
  onPreview,
  onGenerate,
}: IDeepfakeGenerateFormProps) => {
  const modelOptions = DEEPFAKE_MODEL_OPTIONS[functionType];
  const isModelSelectDisabled = modelOptions.length === 1;
  const seedEditSeedMode = Form.useWatch("seedEditSeedMode", form) || DEFAULT_SEEDEDIT_SEED_MODE;
  const formLayoutClassName = `deepfake-config-form deepfake-config-layout has-model-guide is-${functionType}${
    functionType === "faceswap" ? "" : " has-prompt"
  }`;
  const targetImageRules = [
    {
      validator: () => (targetFile.length > EMPTY_UPLOAD_COUNT ? Promise.resolve() : Promise.reject(new Error("请上传目标人脸图片"))),
    },
  ];
  const sourceImageRules = [
    {
      validator: () => (sourceFile.length > EMPTY_UPLOAD_COUNT ? Promise.resolve() : Promise.reject(new Error("请上传驱动人脸"))),
    },
  ];

  return (
    <Card
      title="生成参数配置"
      bordered={false}
      className="deepfake-config-card"
      extra={
        <Button
          type="primary"
          className="deepfake-generate-action"
          icon={<ThunderboltOutlined />}
          loading={loading}
          onClick={onGenerate}
        >
          {loading ? "生成中..." : "开始生成"}
        </Button>
      }
    >
      <Form
        form={form}
        layout="vertical"
        className={formLayoutClassName}
        initialValues={{
          function: DEEPFAKE_DEFAULT_FUNCTION,
          model: DEEPFAKE_DEFAULT_MODEL,
          seedEditScale: DEFAULT_SEEDEDIT_SCALE,
          seedEditSeedMode: DEFAULT_SEEDEDIT_SEED_MODE,
          seedEditSeed: DEFAULT_SEEDEDIT_SEED,
        }}
      >
        <div className="deepfake-upload-fields">
          <Form.Item
            label="上传目标人脸图片"
            name="target"
            rules={targetImageRules}
            tooltip={{
              title: DEEPFAKE_TARGET_TOOLTIPS[functionType],
              placement: "right",
            }}
          >
            <ImageUploadField fileList={targetFile} setFileList={setTargetFile} onPreview={onPreview} />
          </Form.Item>

          {functionType === "faceswap" && (
            <Form.Item
              label="上传驱动人脸"
              name="source"
              rules={sourceImageRules}
              tooltip={{
                title: "提供替换人脸的源图像：其人脸身份与外观将迁移并融合至目标图的人脸区域",
                placement: "right",
              }}
            >
              <ImageUploadField fileList={sourceFile} setFileList={setSourceFile} onPreview={onPreview} />
            </Form.Item>
          )}

        </div>

        <div className="deepfake-config-guide">
          {functionType === "faceswap" ? (
            <FaceSwapModelIntroCard selectedModel={selectedModel} />
          ) : (
            <DeepfakeCapabilityIntroCard functionType={functionType} />
          )}
        </div>

        {functionType !== "faceswap" && (
          <div className="deepfake-prompt-fields">
            {functionType === "fomm" && (
              <Form.Item
                label="动作描述"
                name="fommPrompt"
                rules={[{ required: true, whitespace: true, message: "请输入动作描述" }]}
                tooltip={{
                  title: "描述希望人脸做的动作，如：微笑、点头、说话",
                  placement: "right",
                }}
              >
                <TextArea rows={SHORT_TEXTAREA_ROWS} placeholder={FACE_ANIMATION_DEFAULT_PROMPT} maxLength={FACE_ANIMATION_PROMPT_MAX_LENGTH} showCount />
              </Form.Item>
            )}

            {functionType === "stargan" && (
              <>
                <Form.Item
                  label="编辑指令"
                  name="editPrompt"
                  rules={[{ required: true, whitespace: true, message: "请输入编辑指令" }]}
                  tooltip={{
                    title: "用自然语言描述要对图片做的修改，如：把头发改成红色、加一副眼镜、换成微笑表情",
                    placement: "right",
                  }}
                >
                  <TextArea rows={MEDIUM_TEXTAREA_ROWS} placeholder={ATTRIBUTE_EDIT_PROMPT_PLACEHOLDER} maxLength={PROMPT_MAX_LENGTH} showCount />
                </Form.Item>

                <div className="seededit-advanced-fields">
                  <Form.Item
                    label="编辑强度"
                    name="seedEditScale"
                    tooltip={{
                      title: "对应 SeedEdit 的 scale：数值越大越服从文字指令，原图约束越弱",
                      placement: "right",
                    }}
                  >
                    <Slider
                      min={MIN_SEEDEDIT_SCALE}
                      max={MAX_SEEDEDIT_SCALE}
                      step={SEEDEDIT_SCALE_STEP}
                      marks={{
                        [MIN_SEEDEDIT_SCALE]: "保守",
                        [DEFAULT_SEEDEDIT_SCALE]: "均衡",
                        [MAX_SEEDEDIT_SCALE]: "强改",
                      }}
                    />
                  </Form.Item>

                  <div className="seededit-seed-row">
                    <Form.Item
                      label="随机种子"
                      name="seedEditSeedMode"
                      tooltip={{
                        title: "随机生成适合探索效果；固定复现会在其他参数一致时尽量生成一致结果",
                        placement: "right",
                      }}
                    >
                      <Radio.Group optionType="button" buttonStyle="solid">
                        {SEEDEDIT_SEED_MODE_OPTIONS.map((option) => (
                          <Radio.Button key={option.value} value={option.value}>
                            {option.label}
                          </Radio.Button>
                        ))}
                      </Radio.Group>
                    </Form.Item>

                    {seedEditSeedMode === "fixed" && (
                      <Form.Item
                        label="Seed 值"
                        name="seedEditSeed"
                        rules={[{ required: true, message: "请输入固定种子" }]}
                      >
                        <InputNumber min={MIN_SEEDEDIT_SEED} max={MAX_SEEDEDIT_SEED} precision={0} controls className="seededit-seed-input" />
                      </Form.Item>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <div className="deepfake-control-fields">
          <Form.Item label="功能选择" name="function" rules={[{ required: true, message: "请选择功能" }]}>
            <Radio.Group
              onChange={(event) => {
                const nextFunctionType = event.target.value as TDeepfakeFunction;
                setFunctionType(nextFunctionType);
                form.setFieldsValue({ model: DEEPFAKE_MODEL_OPTIONS[nextFunctionType][DEFAULT_MODEL_OPTION_INDEX] });
              }}
            >
              <Space direction="vertical">
                {DEEPFAKE_FUNCTION_OPTIONS.map((option) => (
                  <Radio key={option.value} value={option.value}>
                    {option.label}
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          </Form.Item>

          <Form.Item label="模型选择" name="model" rules={[{ required: true, message: "请选择模型" }]}>
            <Select disabled={isModelSelectDisabled}>
              {modelOptions.map((model) => (
                <Select.Option key={model} value={model}>
                  {model}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </div>
      </Form>
    </Card>
  );
};
