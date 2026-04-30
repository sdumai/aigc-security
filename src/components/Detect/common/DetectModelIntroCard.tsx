import { CheckCircleOutlined, ExperimentOutlined } from "@ant-design/icons";
import { Space, Tag, Typography } from "antd";

import { FAKE_DETECT_MODEL_INTROS, UNSAFE_DETECT_MODEL_INTRO } from "@/constants/detect";
import type { TImageDetectBackend } from "@/typings/detect";

const { Paragraph, Text } = Typography;

export interface IDetectModelIntroCardProps {
  selectedBackend?: TImageDetectBackend;
  mode?: "fake" | "unsafe";
}

export const DetectModelIntroCard = ({ selectedBackend = "volc", mode = "fake" }: IDetectModelIntroCardProps) => {
  const selectedIntro =
    mode === "unsafe"
      ? UNSAFE_DETECT_MODEL_INTRO
      : FAKE_DETECT_MODEL_INTROS.find((item) => item.backend === selectedBackend) || FAKE_DETECT_MODEL_INTROS[0];
  const otherIntros = mode === "fake" ? FAKE_DETECT_MODEL_INTROS.filter((item) => item.backend !== selectedBackend) : [];

  return (
    <section className="image-model-card detect-model-card">
      <div className="image-model-compact-main">
        <div className="image-model-compact-title">
          <Space size={8}>
            <ExperimentOutlined />
            <Text strong>{selectedIntro.name}</Text>
          </Space>
        </div>

        <Paragraph className="image-model-summary">{selectedIntro.summary}</Paragraph>

        <Space size={[6, 6]} wrap className="image-model-tags">
          {selectedIntro.strengths.map((strength) => (
            <Tag key={strength} icon={<CheckCircleOutlined />} color="success">
              {strength}
            </Tag>
          ))}
        </Space>
      </div>

      <div className="image-model-compact-side">
        <div className="image-model-side-label">{mode === "unsafe" ? "链路说明" : "模型差异"}</div>
        {mode === "unsafe" ? (
          <Tag className="image-model-mini-tag">{selectedIntro.badge}</Tag>
        ) : (
          <Space size={[6, 6]} wrap>
            {otherIntros.map((item) => (
              <Tag key={item.name} className="image-model-mini-tag">
                {item.name} · {item.badge}
              </Tag>
            ))}
          </Space>
        )}
      </div>
    </section>
  );
};
