 import { PageHeader } from "../layout/PageHeader";

interface PlaceholderPageProps {
  title: string;
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <>
      <PageHeader title={title} />
      <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--color-text-tertiary)" }}>
        <p>이 페이지({title})는 아직 구현되지 않았습니다.</p>
      </div>
    </>
  );
}
