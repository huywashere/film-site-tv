import {
  House,
  MagnifyingGlass,
  TelevisionSimple,
  UserCircle,
} from "@phosphor-icons/react";
import { Brand } from "./brand";

const navigationItems = ["Trang chủ", "Phim bộ", "Phim lẻ", "Hoạt hình"];

type TopNavigationProps = {
  onAction: (label: string) => void;
};

export function TopNavigation({ onAction }: TopNavigationProps) {
  return (
    <header className="topbar">
      <Brand />
      <nav className="topbar__navigation" aria-label="Điều hướng chính">
        {navigationItems.map((item, index) => (
          <button
            key={item}
            type="button"
            className={index === 0 ? "nav-button nav-button--active" : "nav-button"}
            data-tv-focusable="true"
            data-tv-focus-default={index === 0 ? "true" : undefined}
            data-focus-id={`nav-${index}`}
            data-focus-row="0"
            onClick={() => onAction(item)}
          >
            {index === 0 && <House weight="fill" aria-hidden="true" />}
            {item}
          </button>
        ))}
      </nav>
      <div className="topbar__actions">
        <button
          type="button"
          className="icon-button"
          aria-label="Tìm kiếm"
          data-tv-focusable="true"
          data-focus-id="nav-search"
          data-focus-row="0"
          onClick={() => onAction("Tìm kiếm")}
        >
          <MagnifyingGlass aria-hidden="true" />
        </button>
        <button
          type="button"
          className="icon-button"
          aria-label="Thiết bị đang phát"
          data-tv-focusable="true"
          data-focus-id="nav-device"
          data-focus-row="0"
          onClick={() => onAction("Thiết bị")}
        >
          <TelevisionSimple aria-hidden="true" />
        </button>
        <button
          type="button"
          className="icon-button"
          aria-label="Tài khoản"
          data-tv-focusable="true"
          data-focus-id="nav-profile"
          data-focus-row="0"
          onClick={() => onAction("Tài khoản")}
        >
          <UserCircle aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
