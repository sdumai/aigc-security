import { Tag, Typography } from "antd";

import { ATTRIBUTE_EDIT_MODEL, FACE_ANIMATION_MODEL } from "@/constants/generate";
import type { TDeepfakeFunction } from "@/typings/generate";

const { Paragraph, Text } = Typography;

const CAPABILITY_INTROS = {
  fomm: {
    title: "人脸动画能力",
    tag: "图生视频",
    model: FACE_ANIMATION_MODEL,
    version: "火山方舟 Seedance Lite I2V",
    summary: "输入单张人脸图与动作描述，生成保持人物外观一致的短视频。",
    strengths: ["单图驱动", "动作文本控制", "短视频输出"],
  },
  stargan: {
    title: "属性编辑能力",
    tag: "图像编辑",
    model: ATTRIBUTE_EDIT_MODEL,
    version: "火山视觉智能 SeedEdit v3.0",
    summary: "按自然语言修改发色、表情、眼镜等属性，并尽量保持人脸身份一致。",
    strengths: ["文本编辑", "身份保持", "属性局部修改"],
  },
} as const;

export interface IDeepfakeCapabilityIntroCardProps {
  functionType: Exclude<TDeepfakeFunction, "faceswap">;
}

export const DeepfakeCapabilityIntroCard = ({ functionType }: IDeepfakeCapabilityIntroCardProps) => {
  const intro = CAPABILITY_INTROS[functionType];

  return (
    <section className="deepfake-capability-card">
      <div className="deepfake-capability-header">
        <span>{intro.title}</span>
        <span className="deepfake-capability-kind">{intro.tag}</span>
      </div>

      <div className="deepfake-capability-body">
        <div className="deepfake-capability-copy">
          <div className="deepfake-capability-model-row">
            <Text strong className="deepfake-capability-model">
              {intro.model}
            </Text>
            <span className="deepfake-capability-version">{intro.version}</span>
          </div>
          <Paragraph className="deepfake-capability-summary">{intro.summary}</Paragraph>

          <div className="deepfake-capability-tags">
            {intro.strengths.map((strength) => (
              <Tag key={strength} color="success">
                {strength}
              </Tag>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
