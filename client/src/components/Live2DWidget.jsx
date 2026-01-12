import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import * as PIXI from "pixi.js";
import { Live2DModel } from "pixi-live2d-display/cubism4";

Live2DModel.registerTicker(PIXI.Ticker);

// Tắt "Hello" cho v7
try {
  PIXI.settings.RENDERER_OPTIONS.hello = false;
} catch (e) {
  // Bỏ qua
}

const Live2DWidget = forwardRef((props, ref) => {
  const containerRef = useRef(null);
  const appRef = useRef(null);
  const modelRef = useRef(null);

  useEffect(() => {
    // Cờ (flag) để xử lý React StrictMode
    let isDestroyed = false;

    if (containerRef.current && !appRef.current) {

      const setupPixi = async () => {
        try {
          const app = new PIXI.Application({
            width: 280,
            height: 350,
            backgroundAlpha: 0,
          });

          appRef.current = app;
          containerRef.current.appendChild(app.view);

          // Tắt tương tác chuột để hết lỗi
          const model = await Live2DModel.from(
            "/live2d-models/miku/miku.model3.json",
            { autoInteract: false }
          );

          // SỬA Ở ĐÂY:
          // Nếu component đã bị dọn dẹp, chỉ cần dừng lại
          // KHÔNG hủy model, vì nó được cache
          if (isDestroyed) {
            return;
          }

          modelRef.current = model;
          app.stage.addChild(model);

          model.anchor.set(0.5, 0.5);
          model.position.set(app.screen.width / 2, app.screen.height / 2);

          const scale = Math.min(
            app.screen.width / model.width,
            app.screen.height / model.height
          );
          model.scale.set(scale);

          model.on("motionFinish", () => {
            // Chỉ quay về Idle nếu không đang nói
            if (!modelRef.current.isSpeaking) {
              model.motion("Idle");
            }
          });

          model.motion("Idle");
          modelRef.current.isSpeaking = false;

        } catch (e) {
          if (!isDestroyed) {
            console.error("Lỗi khi tải Live2D model:", e);
          }
        }
      };

      setupPixi();
    }

    // Hàm dọn dẹp (cleanup)
    return () => {
      isDestroyed = true; // Đặt cờ

      if (appRef.current) {
        appRef.current.destroy(true, true);
        appRef.current = null;
      }
      // Chúng ta không hủy modelRef ở đây, vì loader quản lý cache
    };
  }, []); // Mảng rỗng đảm bảo useEffect chỉ chạy 1 lần

  // Expose methods để điều khiển từ component cha
  useImperativeHandle(ref, () => ({
    startSpeaking: () => {
      if (modelRef.current) {
        modelRef.current.isSpeaking = true;
        // Thử các motion có thể có cho speaking
        const speakingMotions = ["Talk", "Speaking", "Talk_Happy", "Talk_Surprised"];
        let motionPlayed = false;

        for (const motionName of speakingMotions) {
          try {
            if (modelRef.current.internalModel?.motionManager?.motionGroups?.[motionName]) {
              modelRef.current.motion(motionName, 0, PIXI.PRIORITY.HIGH);
              motionPlayed = true;
              break;
            }
          } catch (e) {
            // Bỏ qua nếu motion không tồn tại
          }
        }

        // Nếu không tìm thấy motion speaking, dùng Idle nhưng đánh dấu đang nói
        if (!motionPlayed) {
          modelRef.current.motion("Idle");
        }
      }
    },
    stopSpeaking: () => {
      if (modelRef.current) {
        modelRef.current.isSpeaking = false;
        modelRef.current.motion("Idle");
      }
    },
    isSpeaking: () => {
      return modelRef.current?.isSpeaking || false;
    }
  }));

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
      }}
    />
  );
});

Live2DWidget.displayName = "Live2DWidget";

export default Live2DWidget;