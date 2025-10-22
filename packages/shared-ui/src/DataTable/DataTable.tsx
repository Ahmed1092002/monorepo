import React from "react";
import { Text } from "../Text/Text";
import { Button } from "../Button/Button";

export interface DataTableColumn<T = any> {
  key: string;
  label: string;
  render?: (value: any, item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
}

export interface DataTableProps<T = any> {
  data: T[];
  columns: DataTableColumn<T>[];
  loading?: boolean;
  emptyText?: string;
  emptyDescription?: string;
  onRowClick?: (item: T, index: number) => void;
  className?: string;
  // Pagination
  pagination?: {
    current: number;
    total: number;
    pageSize: number;
    onPageChange: (page: number) => void;
  };
  // Theme customization
  theme?: {
    table?: string;
    header?: string;
    row?: string;
    cell?: string;
    hover?: string;
  };
}

const defaultTheme = {
  table: "w-full",
  header: "bg-gray-50",
  row: "border-b border-gray-200",
  cell: "px-4 py-3",
  hover: "hover:bg-gray-50",
};

export const DataTable = <T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  emptyText = "No data available",
  emptyDescription = "There are no items to display",
  onRowClick,
  className = "",
  pagination,
  theme = defaultTheme,
}: DataTableProps<T>) => {
  const tableTheme = { ...defaultTheme, ...theme };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <Text color="secondary">Loading...</Text>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <Text variant="h5" color="secondary" weight="medium">
          {emptyText}
        </Text>
        <Text color="secondary" className="mt-2">
          {emptyDescription}
        </Text>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="overflow-x-auto">
        <table className={tableTheme.table}>
          <thead className={tableTheme.header}>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`${tableTheme.cell} font-medium text-gray-900 text-${column.align || "left"}`}
                  style={{ width: column.width }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr
                key={index}
                className={`${tableTheme.row} ${onRowClick ? tableTheme.hover : ""} ${
                  onRowClick ? "cursor-pointer" : ""
                }`}
                onClick={() => onRowClick?.(item, index)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`${tableTheme.cell} text-${column.align || "left"}`}
                  >
                    {column.render
                      ? column.render(item[column.key], item, index)
                      : item[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.total > pagination.pageSize && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <Text color="secondary" variant="small">
            Showing {((pagination.current - 1) * pagination.pageSize) + 1} to{" "}
            {Math.min(pagination.current * pagination.pageSize, pagination.total)} of{" "}
            {pagination.total} results
          </Text>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.current - 1)}
              disabled={pagination.current === 1}
            >
              Previous
            </Button>
            <Text color="secondary" variant="small">
              Page {pagination.current} of {Math.ceil(pagination.total / pagination.pageSize)}
            </Text>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.current + 1)}
              disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
