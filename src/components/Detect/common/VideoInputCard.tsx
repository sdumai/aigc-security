import { Button, Card, Input, InputNumber, message, Segmented, Slider, Space, Typography, Upload } from "antd";
import { LinkOutlined, ScanOutlined, UploadOutlined } from "@ant-design/icons";
import type { ReactNode } from "react";

import {
  DEFAULT_BORDER_RADIUS,
  DETECT_PRIMARY_BUTTON_HEIGHT,
  FULL_FLEX,
  FULL_WIDTH,
  PRIMARY_BLUE,
  UPLOAD_ICON_SIZE,
} from "@/constants/ui";
import {
  DEFAULT_VIDEO_UNDERSTANDING_FPS,
  MAX_LOCAL_VIDEO_BASE64_MB,
  MAX_VIDEO_UNDERSTANDING_FPS,
  MIN_VIDEO_UNDERSTANDING_FPS,
  VIDEO_UNDERSTANDING_FPS_STEP,
} from "@/constants/detect";
import type { TDetectInputTab } from "@/typings/detect";

const { Dragger } = Upload;
const { Text } = Typography;

export interface IVideoInputCardProps {
  title: string;
  description?: ReactNode;
  modelIntro?: ReactNode;
  inputTab: TDetectInputTab;
  loading: boolean;
  videoFile: File | null;
  videoUrlInput: string;
  videoPreviewUrl: string;
  videoUploadFileName: string;
  fps?: number;
  detectButtonDisabled: boolean;
  onInputTabChange: (tab: TDetectInputTab) => void;
  onVideoFileChange: (file: File) => void;
  onVideoUrlInputChange: (value: string) => void;
  onFpsChange?: (value: number) => void;
  onVideoUrlLoad?: () => void;
  onDetect: () => void;
  onReset: () => void;
}

export const VideoInputCard = ({
  title,
  description,
  modelIntro,
  inputTab,
  loading,
  videoFile,
  videoUrlInput,
  videoPreviewUrl,
  videoUploadFileName,
  fps = DEFAULT_VIDEO_UNDERSTANDING_FPS,
  detectButtonDisabled,
  onInputTabChange,
  onVideoFileChange,
  onVideoUrlInputChange,
  onFpsChange,
  onVideoUrlLoad,
  onDetect,
  onReset,
}: IVideoInputCardProps) => {
  const hasVideoPreview = videoPreviewUrl.length > 0 || videoFile !== null;

  const handleVideoSelect = (file: File) => {
    if (!file.type.startsWith("video/")) {
      message.error("请选择视频文件（如 MP4）");
      return false;
    }

    onVideoFileChange(file);
    return false;
  };

  const handleFpsChange = (value: number | null) => {
    if (typeof value === "number" && Number.isFinite(value)) {
      onFpsChange?.(value);
    }
  };

  return (
    <Card title={title} bordered={false} className="detect-config-card detect-video-input-card">
      {description && <div className="detect-card-description">{description}</div>}
      <div className="detect-input-mode-row">
        <Segmented
          block
          value={inputTab}
          onChange={(value) => onInputTabChange(value as TDetectInputTab)}
          options={[
            { label: "本地上传", value: "upload", icon: <UploadOutlined /> },
            { label: "视频 URL", value: "url", icon: <LinkOutlined /> },
          ]}
        />
      </div>

      {inputTab === "upload" && (
        <Dragger
          name="video"
          multiple={false}
          accept="video/*"
          showUploadList={false}
          customRequest={({ file }) => handleVideoSelect(file as File)}
          disabled={loading}
          className={`detect-drop-zone detect-video-drop-zone ${hasVideoPreview ? "has-preview" : ""}`}
        >
          <div className={`detect-drop-content ${hasVideoPreview ? "has-preview" : ""}`}>
            {hasVideoPreview ? (
              <div className="detect-video-preview">
                <video src={videoPreviewUrl} controls title={videoUploadFileName} />
              </div>
            ) : (
              <div className="detect-upload-empty">
                <UploadOutlined style={{ fontSize: UPLOAD_ICON_SIZE, color: PRIMARY_BLUE }} />
                <div className="detect-upload-empty-title">点击或拖拽视频到此区域选择</div>
                <div className="detect-upload-empty-hint">建议不超过 {MAX_LOCAL_VIDEO_BASE64_MB}MB</div>
              </div>
            )}
          </div>
        </Dragger>
      )}

      {inputTab === "url" && (
        <div className="detect-url-panel">
          <Space.Compact style={{ width: FULL_WIDTH }}>
            <Input
              size="large"
              placeholder="https://example.com/video.mp4"
              value={videoUrlInput}
              onChange={(event) => onVideoUrlInputChange(event.target.value)}
              onPressEnter={onVideoUrlLoad || onDetect}
              disabled={loading}
              style={{ flex: FULL_FLEX }}
            />
            <Button
              type="primary"
              size="large"
              onClick={onVideoUrlLoad || onDetect}
              loading={loading}
              icon={onVideoUrlLoad ? <LinkOutlined /> : <ScanOutlined />}
            >
              {onVideoUrlLoad ? "加载" : "开始检测"}
            </Button>
          </Space.Compact>
          {hasVideoPreview && (
            <div className="detect-url-preview">
              <div className="detect-video-preview">
                <video src={videoPreviewUrl} controls preload="metadata" />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="detect-action-row detect-video-action-row">
        <Button
          type="primary"
          size="large"
          block
          icon={<ScanOutlined />}
          onClick={onDetect}
          loading={loading}
          disabled={loading || detectButtonDisabled}
          style={{ height: DETECT_PRIMARY_BUTTON_HEIGHT, borderRadius: DEFAULT_BORDER_RADIUS }}
        >
          {loading ? "检测中…" : "开始检测"}
        </Button>
        <Button
          block
          icon={<UploadOutlined />}
          onClick={onReset}
          disabled={loading}
          style={{ height: DETECT_PRIMARY_BUTTON_HEIGHT, borderRadius: DEFAULT_BORDER_RADIUS }}
        >
          重新输入
        </Button>
      </div>

      <div className="detect-param-panel detect-fps-panel">
        <div className="detect-param-header">
          <Text className="detect-param-label">抽帧频率</Text>
          <InputNumber
            min={MIN_VIDEO_UNDERSTANDING_FPS}
            max={MAX_VIDEO_UNDERSTANDING_FPS}
            step={VIDEO_UNDERSTANDING_FPS_STEP}
            value={fps}
            disabled={loading}
            onChange={handleFpsChange}
            addonAfter="fps"
          />
        </div>
        <Slider
          min={MIN_VIDEO_UNDERSTANDING_FPS}
          max={MAX_VIDEO_UNDERSTANDING_FPS}
          step={VIDEO_UNDERSTANDING_FPS_STEP}
          value={fps}
          disabled={loading}
          onChange={onFpsChange}
        />
      </div>
      {modelIntro && <div className="detect-model-intro-wrap">{modelIntro}</div>}
    </Card>
  );
};
