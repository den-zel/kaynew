
import { createPageMetadata } from "@/lib/seo";

export const metadata = {
    ...createPageMetadata({ title: "Experience", path: "/experience" }),
    robots: { index: false, follow: true },
};

const ExperiencePage = () => {
    return (
        <div></div>
    )
}

export default ExperiencePage
