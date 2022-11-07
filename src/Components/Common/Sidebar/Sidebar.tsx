import { useEffect, useState } from "react";
import { SidebarItem, ShrinkedSidebarItem } from "./SidebarItem";
import SidebarUserCard from "./SidebarUserCard";
import NotificationItem from "../../Notifications/NotificationsList";
import { usePath } from "raviger";
import SlideOver from "../../../CAREUI/interactive/SlideOver";

export const SIDEBAR_SHRINK_PREFERENCE_KEY = "sidebarShrinkPreference";

const DASHBOARD = process.env.REACT_APP_DASHBOARD_URL ?? "";

const LOGO = process.env.REACT_APP_LIGHT_LOGO;
const LOGO_COLLAPSE =
  process.env.REACT_APP_LIGHT_COLLAPSE_LOGO || "/images/logo_collapsed.svg";

type StatelessSidebarProps =
  | {
      shrinkable: true;
      shrinked: boolean;
      setShrinked: (state: boolean) => void;
    }
  | {
      shrinkable?: false;
      shrinked?: false;
      setShrinked?: undefined;
    };

// Sidebar item icons.
const Facility = () => <i className="uil uil-hospital" />;
const Patient = () => <i className="uil uil-wheelchair" />;
const Asset = () => <i className="uil uil-shopping-cart-alt" />;
const SampleTest = () => <i className="uil uil-medkit" />;
const Shifting = () => <i className="uil uil-ambulance" />;
const Resource = () => <i className="uil uil-heart-medical" />;
const Result = () => <i className="uil uil-clipboard-notes" />;
const Users = () => <i className="uil uil-users-alt" />;
const NoticeBoard = () => <i className="uil uil-meeting-board" />;
const Dashboard = () => <i className="uil uil-dashboard" />;

const NavItems = [
  { text: "Facilities", to: "/facility", icon: <Facility /> },
  { text: "Patients", to: "/patients", icon: <Patient /> },
  { text: "Assets", to: "/assets", icon: <Asset /> },
  { text: "Sample Test", to: "/sample", icon: <SampleTest /> },
  { text: "Shifting", to: "/shifting", icon: <Shifting /> },
  { text: "Resource", to: "/resource", icon: <Resource /> },
  { text: "External Results", to: "/external_results", icon: <Result /> },
  { text: "Users", to: "/users", icon: <Users /> },
  { text: "Notice Board", to: "/notice_board", icon: <NoticeBoard /> },
];

const StatelessSidebar = ({
  shrinkable = false,
  shrinked = false,
  setShrinked,
}: StatelessSidebarProps) => {
  const path = usePath();
  const Item = shrinked ? ShrinkedSidebarItem : SidebarItem;

  const activeItem = NavItems.reduce((acc, item) => {
    const tag = item.to.replaceAll("/", "");
    return path?.includes(tag) ? tag : acc;
  }, "");

  return (
    <nav
      className={`h-screen group flex flex-col bg-primary-800 pt-5 md:pt-7 pb-5 md:pb-10 ${
        shrinked ? "w-14" : "w-60"
      } transition-all duration-300 ease-in-out`}
    >
      <div className="h-3" /> {/* flexible spacing */}
      <img
        className={`${
          shrinked ? "mx-auto" : "ml-10"
        } h-5 md:h-8 self-start transition mb-5`}
        src={shrinked ? LOGO_COLLAPSE : LOGO}
      />
      <div className="h-7" /> {/* flexible spacing */}
      {NavItems.map((item) => {
        const itemSelected = item.to.replaceAll("/", "") === activeItem;
        return <Item key={item.text} {...item} selected={itemSelected} />;
      })}
      <NotificationItem shrinked={shrinked} />
      <Item text="Dashboard" to={DASHBOARD} icon={<Dashboard />} external />
      <div className="flex-1" />
      {shrinkable && (
        <div
          className={`${
            shrinked ? "mx-auto" : "self-end"
          } flex mt-10 self-end group-hover:mb-2 h-0 group-hover:h-12 opacity-0 group-hover:opacity-100 transition-all duration-200 ease-in-out`}
        >
          <ToggleShrink
            shrinked={shrinked}
            toggle={() => setShrinked && setShrinked(!shrinked)}
          />
        </div>
      )}
      <SidebarUserCard shrinked={shrinked} />
    </nav>
  );
};

export const DesktopSidebar = () => {
  const [shrinked, setShrinked] = useState(
    () => localStorage.getItem(SIDEBAR_SHRINK_PREFERENCE_KEY) === "true"
  );

  useEffect(() => {
    localStorage.setItem(
      SIDEBAR_SHRINK_PREFERENCE_KEY,
      shrinked ? "true" : "false"
    );
  }, [shrinked]);

  return (
    <StatelessSidebar
      shrinked={shrinked}
      setShrinked={setShrinked}
      shrinkable
    />
  );
};

interface MobileSidebarProps {
  open: boolean;
  setOpen: (state: boolean) => void;
}

export const MobileSidebar = (props: MobileSidebarProps) => {
  return (
    <SlideOver {...props} slideFrom="left">
      <StatelessSidebar />
    </SlideOver>
  );
};

interface ToggleShrinkProps {
  shrinked: boolean;
  toggle: () => void;
}

const ToggleShrink = ({ shrinked, toggle }: ToggleShrinkProps) => (
  <div
    className={`flex items-center justify-center w-10 h-10 self-end cursor-pointer rounded text-gray-100 text-opacity-70 hover:text-opacity-100 bg-primary-800 hover:bg-primary-700 ${
      shrinked ? "mx-auto" : "mr-4"
    } transition-all duration-200 ease-in-out`}
    onClick={toggle}
  >
    <i
      className={`fa-solid fa-chevron-up ${
        shrinked ? "rotate-90 text-sm" : "-rotate-90 text-base"
      } transition-all duration-300 delay-150 ease-out`}
    />
  </div>
);
