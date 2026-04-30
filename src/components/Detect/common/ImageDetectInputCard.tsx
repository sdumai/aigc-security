import { Button, Card, Input, Segmented, Space, Upload } from "antd";
import { LinkOutlined, ScanOutlined, UploadOutlined } from "@ant-design/icons";
import type { ReactNode } from "react";
import type { UploadFile, UploadProps } from "antd";

import {
  DETECT_PRIMARY_BUTTON_HEIGHT,
  DEFAULT_BORDER_RADIUS,
  FULL_WIDTH,
  PRIMARY_BLUE,
  UPLOAD_ICON_SIZE,
} from "@/constants/ui";
import { DETECT_STEP_RESULT, EMPTY_RESULT_COUNT, SAMPLE_IMAGE_DETECT_URL } from "@/constants/detect";
import type { IFaceRegion, TDetectInputTab } from "@/typings/detect";

const { Dragger } = Upload;

export interface IImageDetectInputCardProps {
  title: string;
  activeTab: TDetectInputTab;
  loading: boolean;
  uploadedFile: UploadFile | null;
  previewUrl: string;
  currentStep: number;
  hasResult: boolean;
  urlInput: string;
  uploadHint: string;
  modelSelector?: ReactNode;
  modelIntro?: ReactNode;
  detectButtonText: string;
  detectButtonDisabled?: boolean;
  faceRegion?: IFaceRegion;
  onActiveTabChange: (tab: TDetectInputTab) => void;
  onUrlInputChange: (value: string) => void;
  onUrlLoad: () => void;
  onDetect: () => void;
  onReset: () => void;
  uploadProps: UploadProps;
}

export const ImageDetectInputCard = ({
  title,
  activeTab,
  loading,
  uploadedFile,
  previewUrl,
  currentStep,
  hasResult,
  urlInput,
  uploadHint,
  modelSelector,
  modelIntro,
  detectButtonText,
  detectButtonDisabled = false,
  faceRegion,
  onActiveTabChange,
  onUrlInputChange,
  onUrlLoad,
  onDetect,
  onReset,
  uploadProps,
}: IImageDetectInputCardProps) => {
  const hasPreview = uploadedFile !== null && previewUrl.length > EMPTY_RESULT_COUNT;
  const actionText = currentStep === DETECT_STEP_RESULT && hasResult ? "重新检测" : detectButtonText;
  const isDetectDisabled = loading || detectButtonDisabled || !uploadedFile;

  const previewNode = (
    <div className="detect-upload-preview heatmap-overlay">
      <img src={previewUrl} alt="待检测内容" />
      {faceRegion && (
        <div
          className="heatmap-layer"
          style={{
            top: `${faceRegion.y}%`,
            left: `${faceRegion.x}%`,
            width: `${faceRegion.width}%`,
            height: `${faceRegion.height}%`,
          }}
        />
      )}
      <div className="detect-upload-preview-mask">点击或拖拽替换</div>
    </div>
  );

  return (
    <Card title={title} bordered={false} className="detect-config-card detect-image-input-card">
      <div className="detect-input-mode-row">
        <Segmented
          block
          value={activeTab}
          onChange={(value) => onActiveTabChange(value as TDetectInputTab)}
          options={[
            { label: "本地上传", value: "upload", icon: <UploadOutlined /> },
            { label: "URL 解析", value: "url", icon: <LinkOutlined /> },
          ]}
        />
      </div>

      {activeTab === "upload" && (
        <Dragger {...uploadProps} disabled={loading} className={`detect-drop-zone ${hasPreview ? "has-preview" : ""}`}>
          <div className={`detect-drop-content ${hasPreview ? "has-preview" : ""}`}>
            {hasPreview ? (
              previewNode
            ) : (
              <div className="detect-upload-empty">
                <UploadOutlined style={{ fontSize: UPLOAD_ICON_SIZE, color: PRIMARY_BLUE }} />
                <div className="detect-upload-empty-title">点击或拖拽图片到此区域上传</div>
                <div className="detect-upload-empty-hint">{uploadHint}</div>
              </div>
            )}
          </div>
        </Dragger>
      )}

      {activeTab === "url" && (
        <div className="detect-url-panel">
          <Space.Compact style={{ width: FULL_WIDTH }}>
            <Input
              size="large"
              placeholder={SAMPLE_IMAGE_DETECT_URL}
              value={urlInput}
              onChange={(event) => onUrlInputChange(event.target.value)}
              onPressEnter={onUrlLoad}
              disabled={loading}
            />
            <Button type="primary" size="large" onClick={onUrlLoad} loading={loading} icon={<LinkOutlined />}>
              加载
            </Button>
          </Space.Compact>
          {hasPreview && <div className="detect-url-preview">{previewNode}</div>}
        </div>
      )}

      {modelSelector && (
        <div className="detect-param-panel">
          <div className="detect-param-label">检测模型</div>
          {modelSelector}
        </div>
      )}
      {modelIntro && <div className="detect-model-intro-wrap">{modelIntro}</div>}

      <div className="detect-action-row">
        <Button
          type="primary"
          size="large"
          block
          icon={<ScanOutlined />}
          onClick={onDetect}
          loading={loading}
          disabled={isDetectDisabled}
          style={{ height: DETECT_PRIMARY_BUTTON_HEIGHT, borderRadius: DEFAULT_BORDER_RADIUS }}
        >
          {loading ? "检测中..." : actionText}
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
    </Card>
  );
};
