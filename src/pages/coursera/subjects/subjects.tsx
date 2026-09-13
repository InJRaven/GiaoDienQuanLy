import { Container } from '@/components/common/container';
import { Toolbar, ToolbarHeading, ToolbarPageTitle, ToolbarDescription } from '@/partials/common/toolbar';
import { SubjectTable } from './components/subject-table';

export function SubjectsPage() {
  return (
    <Container width="fluid" className="flex flex-col gap-5 py-5">
      <Toolbar>
        <ToolbarHeading>
          <ToolbarPageTitle text="Coursera Courses Management" />
          <ToolbarDescription>
            Manage course list and support links.
          </ToolbarDescription>
        </ToolbarHeading>
      </Toolbar>
      <SubjectTable />
    </Container>
  );
}
