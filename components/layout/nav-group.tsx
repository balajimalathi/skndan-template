'use client'

import { type ReactNode } from 'react'
import Link, { type LinkProps } from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from '@/components/ui/sidebar'
import { Badge } from '../ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import {
    type NavCollapsible,
    type NavItem,
    type NavLink,
    type NavSubItem,
    type NavGroup as NavGroupProps,
} from './types'

function navKey(url: unknown) {
    return typeof url === 'string' ? url : JSON.stringify(url)
}

export function NavGroup({ title, items }: NavGroupProps) {
    const { state, isMobile } = useSidebar()
    const pathname = usePathname()
    return (
        <SidebarGroup>
            <SidebarGroupLabel>{title}</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item: NavItem) => {
                    const key =
                        'url' in item && item.url != null
                            ? `${item.title}-${navKey(item.url)}`
                            : `${item.title}-group`

                    if (!item.items)
                        return <SidebarMenuLink key={key} item={item} pathname={pathname} />

                    if (state === 'collapsed' && !isMobile)
                        return (
                            <SidebarMenuCollapsedDropdown key={key} item={item} pathname={pathname} />
                        )

                    return <SidebarMenuCollapsible key={key} item={item} pathname={pathname} />
                })}
            </SidebarMenu>
        </SidebarGroup>
    )
}

function NavBadge({ children }: { children: ReactNode }) {
    return (
        <Badge
            variant="secondary"
            className="rounded-full border-transparent bg-sidebar-accent px-1 py-0 text-[0.625rem] font-medium text-sidebar-accent-foreground"
        >
            {children}
        </Badge>
    )
}

function SidebarMenuLink({ item, pathname }: { item: NavLink; pathname: string }) {
    const { setOpenMobile } = useSidebar()
    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                asChild
                isActive={checkIsActive(pathname, item)}
                tooltip={item.title}
            >
                <Link href={item.url} onClick={() => setOpenMobile(false)}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    {item.badge && <NavBadge>{item.badge}</NavBadge>}
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    )
}

function SidebarMenuCollapsible({
    item,
    pathname,
}: {
    item: NavCollapsible
    pathname: string
}) {
    const { setOpenMobile } = useSidebar()
    return (
        <Collapsible
            asChild
            defaultOpen={checkIsActive(pathname, item, true)}
            className='group/collapsible'
        >
            <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        {item.badge && <NavBadge>{item.badge}</NavBadge>}
                        <ChevronRight className='ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 rtl:rotate-180' />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent className='CollapsibleContent'>
                    <SidebarMenuSub>
                        {item.items.map((subItem: NavSubItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton
                                    asChild
                                    isActive={checkIsActive(pathname, subItem)}
                                >
                                    <Link href={subItem.url} onClick={() => setOpenMobile(false)}>
                                        {subItem.icon && <subItem.icon />}
                                        <span>{subItem.title}</span>
                                        {subItem.badge && <NavBadge>{subItem.badge}</NavBadge>}
                                    </Link>
                                </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                        ))}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </SidebarMenuItem>
        </Collapsible>
    )
}

function SidebarMenuCollapsedDropdown({
    item,
    pathname,
}: {
    item: NavCollapsible
    pathname: string
}) {
    return (
        <SidebarMenuItem>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                        tooltip={item.title}
                        isActive={checkIsActive(pathname, item)}
                    >
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        {item.badge && <NavBadge>{item.badge}</NavBadge>}
                        <ChevronRight className='ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
                    </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side='right' align='start' sideOffset={4}>
                    <DropdownMenuLabel>
                        {item.title} {item.badge ? `(${item.badge})` : ''}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {item.items.map((sub: NavSubItem) => (
                        <DropdownMenuItem key={`${sub.title}-${navKey(sub.url)}`} asChild>
                            <Link
                                href={sub.url}
                                className={`${checkIsActive(pathname, sub) ? 'bg-secondary' : ''}`}
                            >
                                {sub.icon && <sub.icon />}
                                <span className='max-w-52 text-wrap'>{sub.title}</span>
                                {sub.badge && (
                                    <span className='ms-auto text-xs'>{sub.badge}</span>
                                )}
                            </Link>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </SidebarMenuItem>
    )
}

function pathFromHref(href: LinkProps['href']): string | null {
    if (typeof href === 'string') return href.split('?')[0] ?? href
    if (href && typeof href === 'object' && 'pathname' in href && typeof href.pathname === 'string') {
        return href.pathname.split('?')[0] ?? href.pathname
    }
    return null
}

function checkIsActive(pathname: string, item: NavItem | NavSubItem, mainNav = false) {
    console.log('pathname', pathname)
    console.log('item', item)
    console.log('mainNav', mainNav)
    const itemPath = 'url' in item && item.url != null ? pathFromHref(item.url) : null
    const path = pathname.split('?')[0] ?? pathname

    const subItems = 'items' in item ? item.items : undefined
    const childActive =
        !!subItems?.some((i: NavSubItem) => {
            const p = pathFromHref(i.url)
            return p != null && (path === p || path.startsWith(p + '/'))
        })

    return (
        (itemPath != null && (path === itemPath || path.startsWith(itemPath + '/'))) ||
        childActive ||
        (mainNav &&
            itemPath != null &&
            path.split('/')[1] !== '' &&
            path.split('/')[1] === itemPath.split('/')[1])
    )
}