import { useState } from "react";
import vector28 from "./vector-28.svg";
import vector34 from "./vector-34.svg";
import vector35 from "./vector-35.svg";
import vector36 from "./vector-36.svg";
import vector37 from "./vector-37.svg";

export const DashboardHeaderSection = (): JSX.Element => {
  const [activeTab, setActiveTab] = useState("Dashboard");

  const navigationItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      hasIcon: true,
      isActive: true,
    },
    {
      id: "resources",
      label: "Resources",
      hasIcon: false,
      isActive: false,
    },
    {
      id: "security",
      label: "Security",
      hasIcon: false,
      isActive: false,
    },
    {
      id: "settings",
      label: "Settings",
      hasIcon: false,
      isActive: false,
    },
  ];

  return (
    <header
      className="flex flex-col w-[1440px] items-start fixed top-0 left-0"
      role="banner"
    >
      <div className="flex flex-col h-[52px] items-start gap-2.5 pl-20 pr-[1152px] py-3.5 relative self-stretch w-full bg-[#181921]">
        <div className="inline-flex items-center gap-1 relative flex-[0_0_auto]">
          <div
            className="relative w-6 h-6 bg-[url(/vector-27.svg)] bg-[100%_100%]"
            aria-hidden="true"
          >
            <img
              className="absolute w-[87.50%] h-[77.78%] top-[22.22%] left-[12.50%]"
              alt=""
              src={vector28}
            />
          </div>

          <h1 className="relative w-fit [font-family:'Segoe_UI-Black',Helvetica] font-black text-white text-xs tracking-[0] leading-[normal]">
            CloudOpti
          </h1>
        </div>
      </div>

      <nav
        className="flex flex-col h-10 items-start justify-center gap-2.5 pl-20 pr-[970px] py-3 relative self-stretch w-full bg-[#181921]"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="inline-flex items-center gap-[42px] relative flex-[0_0_auto]">
          <ul className="inline-flex items-center gap-6 relative flex-[0_0_auto] list-none m-0 p-0">
            {navigationItems.map((item) => (
              <li
                key={item.id}
                className="inline-flex items-center gap-1 relative flex-[0_0_auto]"
              >
                <a
                  href={`#${item.id}`}
                  className={`inline-flex items-center gap-1 no-underline ${
                    item.id === "dashboard" ? "text-white" : "text-[#818ca2]"
                  } hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#181921] rounded`}
                  aria-current={item.id === "dashboard" ? "page" : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab(item.label);
                  }}
                >
                  {item.id === "dashboard" && (
                    <div className="relative w-4 h-4" aria-hidden="true">
                      <img
                        className="absolute w-[92.19%] h-[92.19%] top-[7.81%] left-[7.81%]"
                        alt=""
                        src={vector34}
                      />

                      <img
                        className="absolute w-[48.02%] h-[92.19%] top-[7.81%] left-[51.98%]"
                        alt=""
                        src={vector35}
                      />

                      <img
                        className="absolute w-[48.02%] h-[56.35%] top-[43.65%] left-[51.98%]"
                        alt=""
                        src={vector36}
                      />

                      <img
                        className="absolute w-[92.19%] h-[39.69%] top-[60.31%] left-[7.81%]"
                        alt=""
                        src={vector37}
                      />
                    </div>
                  )}

                  <span
                    className={`${
                      item.id === "dashboard"
                        ? "w-fit [font-family:'Albert_Sans-Bold',Helvetica] font-bold text-[10px] whitespace-nowrap relative tracking-[0] leading-[normal]"
                        : item.id === "resources"
                          ? "relative w-[49px] h-3"
                          : "w-fit mt-[-1.00px] [font-family:'Albert_Sans-Bold',Helvetica] font-bold text-[10px] whitespace-nowrap relative tracking-[0] leading-[normal]"
                    }`}
                  >
                    {item.id === "resources" ? (
                      <span className="absolute w-full h-full top-0 left-0 [font-family:'Albert_Sans-Bold',Helvetica] font-bold text-main-collection-passive text-[10px] tracking-[0] leading-[normal] whitespace-nowrap">
                        {item.label}
                      </span>
                    ) : (
                      item.label
                    )}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
};
