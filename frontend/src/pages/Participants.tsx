import { initialParticipants } from "../constants";
import { PageHeader } from "../components/PageHeader";

export function ParticipantsPage() {
  return (
    <>
      <PageHeader title="참여자 및 수료" />

      <section aria-label="참여자 및 수료 관리">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">기업명</th>
                <th scope="col">과정 구분</th>
                <th scope="col">수료자 이름</th>
                <th scope="col">생년월일</th>
                <th scope="col">수료증 번호</th>
                <th scope="col">수료일자</th>
              </tr>
            </thead>
            <tbody>
              {initialParticipants.map((participant) => (
                <tr key={participant.id}>
                  <td>{participant.companyName}</td>
                  <td>{participant.courseType}</td>
                  <td>{participant.name}</td>
                  <td>{participant.birthDate}</td>
                  <td>{participant.certificateNo}</td>
                  <td>{participant.completionDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
