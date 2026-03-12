import ellipse1 from "./ellipse-1.svg";
import ellipse2 from "./ellipse-2.svg";
import ellipse3 from "./ellipse-3.svg";
import ellipse4 from "./ellipse-4.svg";
import frame762 from "./frame-76-2.svg";
import frame76 from "./frame-76.svg";
import group from "./group.png";
import image2 from "./image-2.svg";
import image from "./image.png";
import image1 from "./image.svg";
import line3 from "./line-3.svg";
import line9 from "./line-9.svg";
import line10 from "./line-10.svg";
import line11 from "./line-11.svg";
import line12 from "./line-12.svg";
import td2 from "./td-2.svg";
import td3 from "./td-3.svg";
import td4 from "./td-4.svg";
import td5 from "./td-5.svg";
import td6 from "./td-6.svg";
import td from "./td.svg";
import vector2 from "./vector-2.svg";
import vector3 from "./vector-3.svg";
import vector4 from "./vector-4.svg";
import vector5 from "./vector-5.svg";
import vector6 from "./vector-6.svg";
import vector7 from "./vector-7.svg";
import vector8 from "./vector-8.svg";
import vector9 from "./vector-9.svg";
import vector10 from "./vector-10.svg";
import vector11 from "./vector-11.svg";
import vector12 from "./vector-12.svg";
import vector13 from "./vector-13.svg";
import vector14 from "./vector-14.svg";
import vector15 from "./vector-15.svg";
import vector16 from "./vector-16.svg";
import vector17 from "./vector-17.svg";
import vector18 from "./vector-18.svg";
import vector19 from "./vector-19.svg";
import vector20 from "./vector-20.svg";
import vector21 from "./vector-21.svg";
import vector22 from "./vector-22.svg";
import vector23 from "./vector-23.svg";
import vector24 from "./vector-24.svg";
import vector25 from "./vector-25.svg";
import vector26 from "./vector-26.svg";
import vector29 from "./vector-29.svg";
import vector30 from "./vector-30.svg";
import vector31 from "./vector-31.svg";
import vector32 from "./vector-32.svg";
import vector33 from "./vector-33.svg";
import vector from "./vector.svg";

const quickActions = [
  {
    icon: frame76,
    label: "Rescan",
  },
  {
    icon: null,
    label: "Waste",
    vectors: [vector31, vector32, vector33],
  },
  {
    icon: frame762,
    label: "Export",
  },
];

const metricsData = [
  {
    title: "Potential Savings",
    value: "$340.50",
    change: "+2.5%",
    changeType: "positive",
    comparison: "vs last month",
  },
  {
    title: "Total Monthly Spend",
    value: "$4,520.00",
    change: "+2.5%",
    changeType: "positive",
    comparison: "vs last month",
  },
  {
    title: "Security Level",
    value: "12",
    change: "-3.25",
    changeType: "negative",
    comparison: "vs last month",
  },
  {
    title: "Wasted Resources",
    value: "124",
    change: "+15%",
    changeType: "negative",
    comparison: "vs last month",
  },
];

const chartDates = [
  "Feb 22",
  "Feb 23",
  "Feb 24",
  "Feb 25",
  "Feb 26",
  "Feb 27",
  "Feb 28",
];

const yAxisLabels = ["$800", "$600", "$400", "$200", "$0"];

const serviceBreakdown = [
  {
    icon: [vector2, vector3, vector4, vector5],
    label: "EC2 - 60%",
  },
  {
    icon: [vector6, vector7, vector8],
    label: "RDS - 25%",
  },
  {
    icon: [vector9, vector10, vector11, vector12],
    label: "S3 - 10%",
  },
  {
    icon: [vector13, vector14, vector15],
    label: "Other - 5%",
  },
];

const unusedResourcesData = [
  {
    id: "vol-0a1b2c3d4e5f6",
    type: "EBS Volume",
    typeColor: "#b548ff",
    typeBg: "resources-ebsvolbg",
    typeBorder: "resources-ebsvol",
    size: "100 GB",
    cost: "$45.00",
    actionImage: td,
  },
  {
    id: "snap-3n4o5p6q7r8s9",
    type: "Snapshot",
    typeColor: "teal-500",
    typeBg: "resources-snapshotbg",
    typeBorder: "resources-snapshot",
    size: "26 GB",
    cost: "$12.40",
    actionImage: td2,
  },
  {
    id: "vol-0a1b2c3d4e5f6",
    type: "EBS Volume",
    typeColor: "#b548ff",
    typeBg: "[#49365599]",
    typeBorder: "[#b548ff]",
    size: "100 GB",
    cost: "$45.00",
    actionImage: td3,
  },
  {
    id: "eipalloc-7h8i9j0k1l2m",
    type: "Elastic IP",
    typeColor: "red-600",
    typeBg: "resources-elasticip-BG",
    typeBorder: "resources-elasticip",
    size: "1 IP",
    cost: "$32.00",
    actionImage: td4,
  },
  {
    id: "vol-0a1b2c3d4e5f6",
    type: "EBS Volume",
    typeColor: "#b548ff",
    typeBg: "[#49365599]",
    typeBorder: "[#b548ff]",
    size: "100 GB",
    cost: "$45.00",
    actionImage: td5,
  },
  {
    id: "vol-0a1b2c3d4e5f6",
    type: "EBS Volume",
    typeColor: "#b548ff",
    typeBg: "[#49365599]",
    typeBorder: "[#b548ff]",
    size: "100 GB",
    cost: "$45.00",
    actionImage: td6,
  },
];

export const DashboardMainSection = (): JSX.Element => {
  return (
    <div className="inline-flex items-start gap-10 fixed top-[116px] left-20">
      <aside className="flex flex-col w-[336px] items-start gap-9 relative">
        <h1 className="self-stretch mt-[-1.00px] [font-family:'Albert_Sans-ExtraBold',Helvetica] font-extrabold text-4xl relative text-white tracking-[0] leading-[normal]">
          Dashboard
        </h1>

        <div className="flex flex-col items-start gap-3 relative self-stretch w-full flex-[0_0_auto]">
          <nav
            className="flex flex-col items-start gap-2.5 p-2 relative self-stretch w-full flex-[0_0_auto] bg-[#13141b] rounded-2xl border border-solid border-main-collection-dark-navy-border"
            aria-label="Quick actions"
          >
            <div className="flex items-center gap-1 relative self-stretch w-full flex-[0_0_auto]">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  className="flex w-[104px] h-[108px] items-center justify-center gap-2.5 px-8 py-[26px] relative rounded-2xl hover:bg-[#1f2029] transition-colors"
                  aria-label={action.label}
                >
                  <div className="inline-flex flex-col items-center justify-center gap-2 relative flex-[0_0_auto] mt-[-3.00px] mb-[-3.00px]">
                    {action.icon ? (
                      <img
                        className="relative self-stretch w-full h-10"
                        alt={action.label}
                        src={action.icon}
                      />
                    ) : (
                      <div className="flex h-10 items-start gap-2.5 p-2 relative self-stretch w-full bg-[#1f2029] rounded-[21px]">
                        <div className="relative w-6 h-6">
                          {action.vectors?.map((vector, vIndex) => (
                            <img
                              key={vIndex}
                              className={
                                vIndex === 0
                                  ? "absolute w-[83.33%] h-[79.17%] top-[20.83%] left-[16.67%]"
                                  : vIndex === 1
                                    ? "absolute w-[91.67%] h-[79.17%] top-[20.83%] left-[8.33%]"
                                    : "absolute w-[70.83%] h-[95.83%] top-[4.17%] left-[29.17%]"
                              }
                              alt=""
                              src={vector}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    <span className="relative self-stretch [font-family:'Albert_Sans-SemiBold',Helvetica] font-semibold text-main-collection-passive text-xs text-center tracking-[0] leading-[normal]">
                      {action.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </nav>

          <section
            className="flex flex-col h-[499px] items-center justify-around relative self-stretch w-full bg-main rounded-2xl border border-solid border-main-collection-dark-navy-border"
            aria-label="AI Advisor"
          >
            <div className="flex flex-col items-center justify-between relative flex-1 self-stretch w-full grow">
              <header className="flex items-center justify-between p-4 relative self-stretch w-full flex-[0_0_auto] mt-[-1.00px] ml-[-1.00px] mr-[-1.00px] border-b [border-bottom-style:solid] border-main-collection-dark-navy-border">
                <h2 className="relative w-fit mt-[-0.50px] [font-family:'Albert_Sans-SemiBold',Helvetica] font-semibold text-main-collection-passive text-xs text-center tracking-[0] leading-[normal] whitespace-nowrap">
                  AI Advisor
                </h2>

                <button
                  className="inline-flex items-center gap-[5px] relative flex-[0_0_auto] hover:opacity-80 transition-opacity"
                  aria-label="New Chat"
                >
                  <div className="relative w-3.5 h-3.5 opacity-60">
                    <img
                      className="absolute top-[calc(50.00%_-_6px)] left-[calc(50.00%_-_6px)] w-3 h-3"
                      alt=""
                      src={image2}
                    />
                  </div>
                  <span className="relative w-fit mt-[-1.00px] [font-family:'Albert_Sans-SemiBold',Helvetica] font-semibold text-main-collection-passive text-xs text-center tracking-[0] leading-[normal] whitespace-nowrap">
                    New Chat
                  </span>
                </button>
              </header>

              <div className="inline-flex flex-col items-center gap-3 relative flex-[0_0_auto] opacity-60">
                <div className="relative w-12 h-12 opacity-60">
                  <img
                    className="absolute w-[53.12%] h-[94.79%] top-[5.21%] left-[46.88%]"
                    alt=""
                    src={vector16}
                  />
                  <img
                    className="absolute w-[35.63%] h-[82.71%] top-[17.29%] left-[64.37%]"
                    alt=""
                    src={vector17}
                  />
                  <img
                    className="absolute w-[28.12%] h-[53.12%] top-[46.88%] left-[71.88%]"
                    alt=""
                    src={vector18}
                  />
                  <img
                    className="absolute w-[35.63%] h-[35.63%] top-[64.37%] left-[64.37%]"
                    alt=""
                    src={vector19}
                  />
                  <img
                    className="absolute w-[53.12%] h-[28.12%] top-[71.88%] left-[46.88%]"
                    alt=""
                    src={vector20}
                  />
                  <img
                    className="absolute w-[82.71%] h-[35.63%] top-[64.37%] left-[17.29%]"
                    alt=""
                    src={vector21}
                  />
                  <img
                    className="absolute w-[94.79%] h-[53.12%] top-[46.88%] left-[5.21%]"
                    alt=""
                    src={vector22}
                  />
                  <img
                    className="absolute w-[82.71%] h-[82.71%] top-[17.29%] left-[17.29%]"
                    alt=""
                    src={vector23}
                  />
                </div>

                <p className="relative w-fit opacity-60 [font-family:'Albert_Sans-SemiBold',Helvetica] font-semibold text-[#818ca2] text-base text-center tracking-[-1.76px] leading-[normal] whitespace-nowrap">
                  Coming soon.....
                </p>
              </div>

              <footer className="flex flex-col items-center relative self-stretch w-full flex-[0_0_auto] mb-[-1.00px] ml-[-1.00px] mr-[-1.00px] border-t [border-top-style:solid] border-main-collection-dark-navy-border">
                <div className="flex items-center justify-between p-4 relative self-stretch w-full flex-[0_0_auto]">
                  <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
                    <div className="relative w-6 h-6">
                      <img
                        className="absolute w-[91.66%] h-[95.83%] top-[4.17%] left-[8.34%]"
                        alt=""
                        src={vector24}
                      />
                    </div>
                    <label
                      htmlFor="ai-advisor-input"
                      className="relative w-fit opacity-60 [font-family:'Albert_Sans-SemiBold',Helvetica] font-semibold text-main-collection-passivetext text-xs text-center tracking-[0] leading-[normal] whitespace-nowrap"
                    >
                      Ask about costs or security...
                    </label>
                  </div>

                  <button
                    className="relative w-6 h-6 hover:opacity-80 transition-opacity"
                    aria-label="Send message"
                  >
                    <img
                      className="absolute w-[91.68%] h-[91.68%] top-[8.32%] left-[8.32%]"
                      alt=""
                      src={vector25}
                    />
                    <img
                      className="absolute w-[79.17%] h-[54.17%] top-[45.83%] left-[20.83%]"
                      alt=""
                      src={vector26}
                    />
                  </button>
                </div>
              </footer>
            </div>
          </section>
        </div>
      </aside>

      <main className="flex flex-col w-[904px] items-start gap-9 relative">
        <div className="flex w-[412px] items-center gap-2.5 p-2.5 relative flex-[0_0_auto] bg-[#1f2029] rounded-2xl border border-solid border-main-collection-dark-navy-border">
          <div className="relative w-6 h-6">
            <img
              className="absolute w-[34.75%] h-[34.75%] top-[65.25%] left-[65.25%]"
              alt=""
              src={vector29}
            />
            <img
              className="absolute w-[91.67%] h-[91.67%] top-[8.33%] left-[8.33%]"
              alt=""
              src={vector30}
            />
          </div>
          <label
            htmlFor="resource-search"
            className="relative w-fit [font-family:'Albert_Sans-Medium',Helvetica] font-medium text-main-collection-passive text-base text-center tracking-[0] leading-[normal] whitespace-nowrap"
          >
            Search resources by ID or tag...
          </label>
        </div>

        <div className="flex flex-col items-start gap-3 relative self-stretch w-full flex-[0_0_auto]">
          <div className="flex flex-col items-start gap-3 relative self-stretch w-full flex-[0_0_auto]">
            <section
              className="flex h-[124px] items-center justify-around gap-2.5 px-0 py-px relative self-stretch w-full bg-[#13141b] rounded-2xl border border-solid border-main-collection-dark-navy-border"
              aria-label="Key metrics"
            >
              <div className="flex items-center justify-between relative flex-1 self-stretch grow">
                {metricsData.map((metric, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between relative flex-1 self-stretch grow"
                  >
                    <article className="flex flex-col items-center justify-center gap-1.5 relative flex-1 self-stretch grow">
                      <h3 className="relative self-stretch [font-family:'Segoe_UI-Black',Helvetica] font-black text-[#818ca2] text-xs text-center tracking-[0] leading-[normal]">
                        {metric.title}
                      </h3>
                      <p className="relative self-stretch [font-family:'Segoe_UI-Black',Helvetica] font-black text-white text-2xl text-center tracking-[0] leading-[normal]">
                        {metric.value}
                      </p>
                      <div className="flex items-center justify-center gap-1 relative self-stretch w-full flex-[0_0_auto]">
                        <div className="inline-flex items-center gap-1 relative flex-[0_0_auto]">
                          <span
                            className={`inline-flex items-center justify-center gap-2.5 px-2 py-1 relative flex-[0_0_auto] rounded-2xl ${
                              metric.changeType === "positive"
                                ? "bg-[#10b9811a]"
                                : "bg-[#b910121a]"
                            }`}
                          >
                            <span
                              className={`relative w-fit mt-[-1.00px] [font-family:'Albert_Sans-SemiBold',Helvetica] font-semibold text-xs tracking-[0] leading-4 whitespace-nowrap ${
                                metric.changeType === "positive"
                                  ? "text-emerald-500"
                                  : "text-[#b91012]"
                              }`}
                            >
                              {metric.change}
                            </span>
                          </span>
                          <span className="relative w-fit [font-family:'Albert_Sans-Medium',Helvetica] font-medium text-[#818ca2] text-xs tracking-[0] leading-4 whitespace-nowrap">
                            {metric.comparison}
                          </span>
                        </div>
                      </div>
                    </article>
                    {index < metricsData.length - 1 && (
                      <img
                        className="relative w-px h-[122px] object-cover"
                        alt=""
                        src={[line10, line11, line12][index]}
                      />
                    )}
                  </div>
                ))}
              </div>
            </section>

            <div className="flex items-center gap-3 relative self-stretch w-full flex-[0_0_auto]">
              <section
                className="flex flex-col w-[643px] h-[329px] items-start gap-6 p-6 relative bg-[#181921] rounded-[20px] border border-solid border-[#242732]"
                aria-label="Cost trend chart"
              >
                <header className="flex h-[52px] items-center justify-between relative self-stretch w-full">
                  <div className="flex flex-col w-[188.59px] h-[52px] items-start gap-1 relative">
                    <div className="relative self-stretch w-full h-7">
                      <h2 className="absolute top-0 left-0 [font-family:'Albert_Sans-ExtraBold',Helvetica] font-extrabold text-white text-xl tracking-[0] leading-7 whitespace-nowrap">
                        Cost Trend
                      </h2>
                    </div>
                    <div className="relative self-stretch w-full h-5">
                      <p className="absolute -top-px left-0 [font-family:'Albert_Sans-Regular',Helvetica] font-normal text-[#818ca2] text-sm tracking-[0] leading-5 whitespace-nowrap">
                        Last 7 days spending analysis
                      </p>
                    </div>
                  </div>

                  <div className="flex w-[68.64px] h-5 items-center gap-2 relative">
                    <div className="relative w-5 h-5">
                      <img
                        className="absolute w-[95.83%] h-[75.00%] top-[25.00%] left-[4.17%]"
                        alt=""
                        src={vector}
                      />
                      <img
                        className="absolute w-[37.50%] h-[75.00%] top-[25.00%] left-[62.50%]"
                        alt=""
                        src={image1}
                      />
                    </div>
                    <div className="relative flex-1 grow h-5">
                      <span className="absolute -top-px left-0 [font-family:'Albert_Sans-SemiBold',Helvetica] font-semibold text-emerald-500 text-sm tracking-[0] leading-5 whitespace-nowrap">
                        +5.2%
                      </span>
                    </div>
                  </div>
                </header>

                <div className="relative self-stretch w-full h-[200px]">
                  <div className="relative w-[653px] h-[200px]">
                    <div className="flex w-[560px] h-3.5 items-center justify-between absolute top-[calc(50.00%_+_86px)] left-[calc(50.00%_-_292px)]">
                      {chartDates.map((date, index) => (
                        <div
                          key={index}
                          className="relative self-stretch w-[42px]"
                        >
                          <span className="absolute w-[95.24%] h-full top-0 left-0 [font-family:'Inter-Regular',Helvetica] font-normal text-[#818ca2] text-xs text-center tracking-[0] leading-[normal] whitespace-nowrap">
                            {date}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="absolute w-[4.39%] top-[calc(50.00%_-_93px)] left-[2.27%] h-[175px] flex items-center">
                      <div className="flex h-[175px] flex-1 relative flex-col w-[28.67px] items-end gap-[25px]">
                        {yAxisLabels.map((label, index) => (
                          <div
                            key={index}
                            className={`relative ${
                              index === yAxisLabels.length - 1
                                ? "w-[18px] h-[15px] mr-[-2.00px]"
                                : index === yAxisLabels.length - 2
                                  ? "w-8 h-[15px] ml-[-1.33px] mr-[-2.00px]"
                                  : "w-[33px] h-[15px] ml-[-2.33px] mr-[-2.00px]"
                            }`}
                          >
                            <span
                              className={`absolute ${
                                index === yAxisLabels.length - 1
                                  ? "w-[88.89%]"
                                  : index === yAxisLabels.length - 2
                                    ? "w-[93.75%]"
                                    : "w-[93.94%]"
                              } h-full top-0 left-0 [font-family:'Inter-Regular',Helvetica] font-normal text-[#818ca2] text-xs text-right tracking-[0] leading-[normal]`}
                            >
                              {label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <img
                      className="absolute w-[91.59%] h-[82.98%] top-[17.02%] left-[8.41%]"
                      alt="Cost trend chart"
                      src={group}
                    />
                    <img
                      className="absolute w-[91.89%] h-full top-0 left-[8.11%]"
                      alt=""
                      src={image}
                    />
                  </div>
                </div>
              </section>

              <section
                className="flex flex-col w-[250px] h-[329px] items-center gap-2.5 p-3 relative mr-[-1.00px] bg-[#181921] rounded-[20px] border border-solid border-main-collection-dark-navy-border"
                aria-label="Spend by service"
              >
                <div className="flex flex-col items-start gap-3 relative self-stretch w-full flex-[0_0_auto] mb-[-1.00px]">
                  <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
                    <div className="flex flex-col items-center gap-6 relative self-stretch w-full flex-[0_0_auto]">
                      <h2 className="relative self-stretch h-[19px] mt-[-1.00px] [font-family:'Albert_Sans-Bold',Helvetica] font-bold text-white text-base tracking-[0] leading-[normal] whitespace-nowrap">
                        Spend by Service
                      </h2>

                      <div className="relative w-[187px] h-[187px]">
                        <img
                          className="absolute -top-0.5 left-[62px] w-[35px] h-[37px]"
                          alt=""
                          src={ellipse1}
                        />
                        <img
                          className="absolute top-[35px] left-[-3px] w-[61px] h-[138px]"
                          alt=""
                          src={ellipse2}
                        />
                        <img
                          className="absolute -top-0.5 left-[35px] w-[154px] h-48"
                          alt=""
                          src={ellipse3}
                        />
                        <img
                          className="absolute top-px left-3.5 w-[62px] h-[57px]"
                          alt=""
                          src={ellipse4}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-end gap-2 relative self-stretch w-full flex-[0_0_auto]">
                    <img
                      className="relative w-[234px] h-px mt-[-1.00px] ml-[-4.00px] mr-[-4.00px] object-cover"
                      alt=""
                      src={line3}
                    />

                    <div className="flex items-center justify-center gap-[52px] px-3 py-2 relative self-stretch w-full flex-[0_0_auto] rounded-xl border-main-collection-dark-navy-border">
                      <ul className="inline-flex flex-col items-start gap-2 relative flex-[0_0_auto] ml-[-0.50px] list-none">
                        {serviceBreakdown.slice(0, 2).map((service, index) => (
                          <li
                            key={index}
                            className="flex items-center gap-1.5 relative self-stretch w-full flex-[0_0_auto]"
                          >
                            <div className="relative w-4 h-4">
                              {service.icon.map((icon, iconIndex) => (
                                <img
                                  key={iconIndex}
                                  className={
                                    index === 0
                                      ? iconIndex === 0
                                        ? "absolute w-[83.85%] h-[96.35%] top-[3.65%] left-[16.15%]"
                                        : iconIndex === 1
                                          ? "absolute w-[96.35%] h-[46.35%] top-[53.65%] left-[3.65%]"
                                          : iconIndex === 2
                                            ? "absolute w-[79.69%] h-[29.69%] top-[70.31%] left-[20.31%]"
                                            : "absolute w-[54.69%] h-[29.69%] top-[70.31%] left-[45.31%]"
                                      : iconIndex === 0
                                        ? "absolute w-[92.19%] h-[96.35%] top-[3.65%] left-[7.81%]"
                                        : iconIndex === 1
                                          ? "absolute w-[92.19%] h-[83.85%] top-[16.15%] left-[7.81%]"
                                          : "absolute w-[92.19%] h-[54.69%] top-[45.31%] left-[7.81%]"
                                  }
                                  alt=""
                                  src={icon}
                                />
                              ))}
                            </div>
                            <span className="relative w-fit [font-family:'Albert_Sans-Bold',Helvetica] font-bold text-white text-[10px] tracking-[0] leading-[normal] whitespace-nowrap">
                              {service.label}
                            </span>
                          </li>
                        ))}
                      </ul>

                      <ul className="inline-flex flex-col items-start gap-2 relative flex-[0_0_auto] mr-[-0.50px] list-none">
                        {serviceBreakdown.slice(2, 4).map((service, index) => (
                          <li
                            key={index}
                            className="inline-flex items-center gap-1.5 relative flex-[0_0_auto]"
                          >
                            <div className="relative w-4 h-4">
                              {service.icon.map((icon, iconIndex) => (
                                <img
                                  key={iconIndex}
                                  className={
                                    index === 0
                                      ? iconIndex === 0
                                        ? "absolute w-[63.02%] h-[38.02%] top-[61.98%] left-[36.98%]"
                                        : iconIndex === 1
                                          ? "absolute w-[96.35%] h-[88.02%] top-[11.98%] left-[3.65%]"
                                          : iconIndex === 2
                                            ? "absolute w-[96.13%] h-[54.63%] top-[45.37%] left-[3.87%]"
                                            : "absolute w-[79.69%] h-[38.02%] top-[61.98%] left-[20.31%]"
                                      : iconIndex === 0
                                        ? "absolute w-[96.34%] h-[96.36%] top-[3.64%] left-[3.66%]"
                                        : iconIndex === 1
                                          ? "absolute w-[96.35%] h-[54.69%] top-[45.31%] left-[3.65%]"
                                          : "absolute w-[96.35%] h-[33.85%] top-[66.15%] left-[3.65%]"
                                  }
                                  alt=""
                                  src={icon}
                                />
                              ))}
                            </div>
                            <span className="relative w-fit [font-family:'Albert_Sans-Bold',Helvetica] font-bold text-white text-[10px] tracking-[0] leading-[normal] whitespace-nowrap">
                              {service.label}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <section
            className="flex flex-col items-start gap-6 p-6 relative self-stretch w-full flex-[0_0_auto] bg-[#181921] rounded-[20px] border border-solid border-[#242732]"
            aria-label="Unused resources table"
          >
            <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
              <div className="relative self-stretch w-full h-7">
                <h2 className="absolute top-0 left-0 [font-family:'Albert_Sans-ExtraBold',Helvetica] font-extrabold text-white text-xl tracking-[0] leading-7 whitespace-nowrap">
                  Unused Resources
                </h2>
              </div>

              <div className="flex flex-col items-start gap-4 relative self-stretch w-full flex-[0_0_auto]">
                <div className="flex flex-col h-[425px] items-start gap-[17px] relative self-stretch w-full">
                  <div className="flex flex-col items-start gap-1 relative self-stretch w-full flex-[0_0_auto]">
                    <div
                      className="flex items-center justify-between relative self-stretch w-full flex-[0_0_auto] shadow-[0px_4px_4px_#00000040]"
                      role="row"
                    >
                      <div
                        className="relative w-[180px] mt-[-1.00px] [font-family:'Albert_Sans-Bold',Helvetica] font-bold text-[#818ca2] text-xs text-center tracking-[1.20px] leading-4"
                        role="columnheader"
                      >
                        RESOURCE ID
                      </div>
                      <div
                        className="relative w-[140px] mt-[-1.00px] [font-family:'Albert_Sans-Bold',Helvetica] font-bold text-[#818ca2] text-xs text-center tracking-[1.20px] leading-4"
                        role="columnheader"
                      >
                        TYPE
                      </div>
                      <div
                        className="relative w-[140px] mt-[-1.00px] [font-family:'Albert_Sans-Bold',Helvetica] font-bold text-[#818ca2] text-xs text-center tracking-[1.20px] leading-4"
                        role="columnheader"
                      >
                        SIZE
                      </div>
                      <div
                        className="relative w-[140px] mt-[-1.00px] [font-family:'Albert_Sans-Bold',Helvetica] font-bold text-[#818ca2] text-xs text-center tracking-[1.20px] leading-4"
                        role="columnheader"
                      >
                        COST
                      </div>
                      <div
                        className="relative w-[140px] mt-[-1.00px] [font-family:'Albert_Sans-Bold',Helvetica] font-bold text-[#818ca2] text-xs text-center tracking-[1.20px] leading-4"
                        role="columnheader"
                      >
                        ACTIONS
                      </div>
                    </div>

                    <img
                      className="relative w-[856px] h-px object-cover"
                      alt=""
                      src={line9}
                    />
                  </div>

                  <div
                    className="flex flex-col items-center relative flex-1 self-stretch w-full grow border-b [border-bottom-style:solid] border-[#242732]"
                    role="rowgroup"
                  >
                    {unusedResourcesData.map((resource, index) => (
                      <div
                        key={index}
                        className="flex h-16 items-start justify-between relative self-stretch w-full"
                        role="row"
                      >
                        <div
                          className="flex flex-col w-[180px] items-center justify-center gap-2.5 relative self-stretch"
                          role="cell"
                        >
                          <div className="bg-[#2f324a99] inline-flex items-start px-3 py-1.5 relative flex-[0_0_auto] rounded-2xl border-[0.5px] border-solid border-[#479dff]">
                            <span className="relative w-fit [font-family:'Albert_Sans-Medium',Helvetica] font-medium text-[#1a85ff] text-xs tracking-[0] leading-[normal] whitespace-nowrap">
                              {resource.id}
                            </span>
                          </div>
                        </div>

                        <div
                          className="flex flex-col w-[140px] items-center justify-center gap-2.5 relative self-stretch"
                          role="cell"
                        >
                          <div
                            className={`inline-flex items-center justify-center gap-2.5 px-3 py-1.5 relative flex-[0_0_auto] bg-${resource.typeBg} rounded-2xl border-[0.5px] border-solid border-${resource.typeBorder}`}
                          >
                            <span
                              className={`relative w-fit mt-[-0.50px] [font-family:'Albert_Sans-SemiBold',Helvetica] font-semibold text-${resource.typeColor} text-xs tracking-[0] leading-[normal] whitespace-nowrap`}
                            >
                              {resource.type}
                            </span>
                          </div>
                        </div>

                        <div
                          className="flex w-[140px] items-center justify-center gap-2.5 px-4 py-[22px] relative self-stretch"
                          role="cell"
                        >
                          <span className="relative w-fit mt-[-1.00px] [font-family:'Albert_Sans-Regular',Helvetica] font-normal text-[#818ca2] text-sm tracking-[0] leading-5 whitespace-nowrap">
                            {resource.size}
                          </span>
                        </div>

                        <div
                          className="flex w-[140px] items-center justify-center gap-2.5 px-0 py-[22px] relative self-stretch"
                          role="cell"
                        >
                          <span
                            className={`relative w-fit mt-[-1.00px] [font-family:'Albert_Sans-Bold',Helvetica] font-bold ${resource.cost === "$32.00" ? "text-main-collection-cost" : "text-red-500"} text-sm text-right tracking-[0] leading-5 whitespace-nowrap`}
                          >
                            {resource.cost}
                          </span>
                        </div>

                        <img
                          className="relative self-stretch w-[140px]"
                          alt="Actions"
                          src={resource.actionImage}
                          role="cell"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
